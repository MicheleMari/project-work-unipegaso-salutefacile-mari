<?php

namespace App\Services;

use App\Core\HttpException;
use App\Core\Security;
use App\Models\Encounter;
use App\Models\Patient;
use App\Repositories\EncounterRepository;
use App\Repositories\PatientRepository;

class EncounterService
{
    private EncounterRepository $encounters;
    private PatientRepository $patients;

    public function __construct()
    {
        $this->encounters = new EncounterRepository();
        $this->patients = new PatientRepository();
    }

    public function list(): array
    {
        $user = $this->currentUser();
        if ($user['role'] === 'dottore') {
            $doctorId = (int) ($user['id'] ?? 0);
            return array_map(fn (Encounter $e) => $e->toArray(), $this->encounters->allForDoctor($doctorId));
        }

        return array_map(fn (Encounter $e) => $e->toArray(), $this->encounters->all());
    }

    public function get(int $id): array
    {
        $user = $this->currentUser();
        if ($user['role'] === 'dottore') {
            $encounter = $this->encounters->findForDoctor($id, (int) ($user['id'] ?? 0));
        } else {
            $encounter = $this->encounters->find($id);
        }

        if (!$encounter) {
            throw new HttpException('Encounter not found', 404);
        }
        return $encounter->toArray();
    }

    public function create(array $data): array
    {
        $user = $this->currentUser();
        if ($user['role'] === 'dottore') {
            throw new HttpException('Forbidden', 403);
        }

        [$patient, $encounter] = $this->buildEntities($data, true);
        $patient = $this->persistPatient($patient);
        $encounter->patient_id = $patient->id;
        $created = $this->encounters->create($encounter);
        $created->patient = $patient;
        return $created->toArray();
    }

    public function replace(int $id, array $data): array
    {
        $user = $this->currentUser();
        $existing = $this->fetchEncounterForRole($id, $user);
        if (!$existing) {
            throw new HttpException('Encounter not found', 404);
        }

        [$patient, $encounter] = $this->buildEntities($data, false);
        $patient->id = $existing->patient_id;
        $patient = $this->persistPatient($patient);

        $encounter->id = $id;
        $encounter->patient_id = $patient->id;
        $this->applyRoleConstraints($user, $existing, $encounter);
        $this->encounters->update($encounter);
        $encounter->patient = $patient;
        return $encounter->toArray();
    }

    public function patch(int $id, array $data): array
    {
        $user = $this->currentUser();
        $existing = $this->fetchEncounterForRole($id, $user);
        if (!$existing) {
            throw new HttpException('Encounter not found', 404);
        }

        $mergedEncounter = array_merge($existing->toArray(), $data['encounter'] ?? $data);
        $mergedPatient = array_merge($existing->patient ? $existing->patient->toArray() : [], $data['patient'] ?? []);

        [$patient, $encounter] = $this->buildEntities(
            ['patient' => $mergedPatient, 'encounter' => $mergedEncounter],
            false
        );

        $patient->id = $existing->patient_id;
        $patient = $this->persistPatient($patient);

        $encounter->id = $id;
        $encounter->patient_id = $patient->id;
        $this->applyRoleConstraints($user, $existing, $encounter);
        $this->encounters->update($encounter);
        $encounter->patient = $patient;

        return $encounter->toArray();
    }

    public function delete(int $id): void
    {
        $user = $this->currentUser();
        if ($user['role'] === 'dottore') {
            throw new HttpException('Forbidden', 403);
        }
        if (!$this->encounters->delete($id)) {
            throw new HttpException('Encounter not found', 404);
        }
    }

    private function persistPatient(Patient $patient): Patient
    {
        if ($patient->id) {
            return $this->patients->update($patient);
        }

        $existing = $this->patients->findByCf($patient->cf);
        if ($existing) {
            return $existing;
        }

        return $this->patients->create($patient);
    }

    private function buildEntities(array $payload, bool $isCreate): array
    {
        $patientData = $payload['patient'] ?? $payload;
        $encounterData = $payload['encounter'] ?? $payload;

        $patient = new Patient($this->validatePatient($patientData, $isCreate));
        $encounter = new Encounter($this->validateEncounter($encounterData, $isCreate));

        return [$patient, $encounter];
    }

    private function applyRoleConstraints(array $user, Encounter $existing, Encounter $incoming): void
    {
        if ($user['role'] === 'dottore') {
            $incoming->doctor_id = (int) ($user['id'] ?? 0);
            if ($existing->doctor_id && $existing->doctor_id !== $incoming->doctor_id) {
                throw new HttpException('Forbidden', 403);
            }
        }

        if ($user['role'] === 'operatore') {
            // Operatore non può refertare (notes)
            $incoming->notes = $existing->notes;
        }
    }

    private function fetchEncounterForRole(int $id, array $user): ?Encounter
    {
        if ($user['role'] === 'dottore') {
            return $this->encounters->findForDoctor($id, (int) ($user['id'] ?? 0));
        }
        return $this->encounters->find($id);
    }

    private function validatePatient(array $data, bool $isCreate): array
    {
        $required = ['full_name', 'cf'];
        foreach ($required as $field) {
            if ($isCreate && empty($data[$field])) {
                throw new HttpException("Missing patient field: {$field}", 422);
            }
        }

        $clean = [];
        $clean['full_name'] = $this->sanitizeText($data['full_name'] ?? '', 120);
        if (!preg_match('/^[A-Za-zÀ-ÿ\s\.\'\-]{2,120}$/u', $clean['full_name'])) {
            throw new HttpException('Invalid patient full name', 422);
        }

        $clean['cf'] = strtoupper($this->sanitizeText($data['cf'] ?? '', 16));
        if (!preg_match('/^[A-Z0-9]{11,16}$/', $clean['cf'])) {
            throw new HttpException('Invalid codice fiscale format', 422);
        }

        $clean['birth_date'] = $this->sanitizeDate($data['birth_date'] ?? null, false);
        $clean['gender'] = $this->sanitizeEnum($data['gender'] ?? null, ['M', 'F']);
        $clean['address'] = $this->sanitizeText($data['address'] ?? null, 200, true);
        $clean['city'] = $this->sanitizeText($data['city'] ?? null, 120, true);
        $clean['phone'] = $this->sanitizePhone($data['phone'] ?? null);
        $clean['email'] = $this->sanitizeEmail($data['email'] ?? null);

        return $clean;
    }

    private function validateEncounter(array $data, bool $isCreate): array
    {
        if ($isCreate && empty($data['arrival_at'])) {
            $data['arrival_at'] = date(DATE_ATOM);
        }

        $states = ['Registrato', 'In Attesa Visita', 'In Visita', 'Attesa Esiti', 'OBI', 'Refertato', 'Dimesso', 'Ricoverato'];
        $priorities = ['red', 'orange', 'green', 'white'];

        $clean = [];
        $clean['arrival_at'] = $this->sanitizeDateTime($data['arrival_at'] ?? date(DATE_ATOM));
        $clean['state'] = $this->sanitizeEnum($data['state'] ?? 'Registrato', $states) ?? 'Registrato';
        $clean['priority'] = $this->sanitizeEnum($data['priority'] ?? 'green', $priorities) ?? 'green';
        $clean['symptoms'] = $this->sanitizeText($data['symptoms'] ?? null, 500, true);
        $clean['doctor_id'] = isset($data['doctor_id']) ? (int) $data['doctor_id'] : null;
        $clean['notes'] = $this->sanitizeText($data['notes'] ?? null, 5000, true);

        return $clean;
    }

    private function sanitizeText(?string $value, int $maxLength, bool $nullable = false): ?string
    {
        if ($nullable && ($value === null || $value === '')) {
            return null;
        }
        $sanitized = strip_tags((string) $value);
        $sanitized = preg_replace('/[\\x00-\\x1F\\x7F]/', '', $sanitized);
        $sanitized = mb_substr(trim($sanitized), 0, $maxLength);
        return $nullable && $sanitized === '' ? null : $sanitized;
    }

    private function sanitizePhone(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $value = $this->sanitizeText($value, 20);
        if (!preg_match('/^[0-9\\+\\-\\s]{7,20}$/', $value)) {
            throw new HttpException('Invalid phone number', 422);
        }
        return $value;
    }

    private function sanitizeEmail(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $value = filter_var($value, FILTER_SANITIZE_EMAIL);
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new HttpException('Invalid email', 422);
        }
        return $value;
    }

    private function sanitizeDate(?string $value, bool $required): ?string
    {
        if (!$value) {
            if ($required) {
                throw new HttpException('Invalid date', 422);
            }
            return null;
        }
        $ts = strtotime($value);
        if ($ts === false) {
            throw new HttpException('Invalid date', 422);
        }
        return date('Y-m-d', $ts);
    }

    private function sanitizeDateTime(?string $value): string
    {
        $ts = strtotime((string) $value);
        if ($ts === false) {
            throw new HttpException('Invalid datetime', 422);
        }
        return date(DATE_ATOM, $ts);
    }

    private function sanitizeEnum(?string $value, array $allowed): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (!in_array($value, $allowed, true)) {
            throw new HttpException('Invalid value', 422);
        }
        return $value;
    }

    private function currentUser(): array
    {
        $request = Security::getCurrentRequest();
        $user = $request ? $request->getUser() : [];
        $role = $user['role'] ?? 'operatore';
        return array_merge(['role' => $role], $user);
    }
}
