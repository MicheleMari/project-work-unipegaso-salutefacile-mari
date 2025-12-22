<?php

namespace App\Models;

class Encounter
{
    public int $id;
    public int $patient_id;
    public string $arrival_at;
    public string $state;
    public string $priority;
    public ?string $symptoms;
    public ?int $doctor_id;
    public ?string $doctor_name;
    public ?string $notes;
    public ?string $created_at;
    public ?string $updated_at;
    public ?Patient $patient;

    public function __construct(array $data = [])
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->patient_id = (int) ($data['patient_id'] ?? 0);
        $this->arrival_at = (string) ($data['arrival_at'] ?? date(DATE_ATOM));
        $this->state = (string) ($data['state'] ?? 'Registrato');
        $this->priority = (string) ($data['priority'] ?? 'green');
        $this->symptoms = $data['symptoms'] ?? null;
        $this->doctor_id = isset($data['doctor_id']) ? (int) $data['doctor_id'] : null;
        $this->doctor_name = $data['doctor_name'] ?? null;
        $this->notes = $data['notes'] ?? null;
        $this->created_at = $data['created_at'] ?? null;
        $this->updated_at = $data['updated_at'] ?? null;
        $this->patient = isset($data['patient']) && $data['patient'] instanceof Patient
            ? $data['patient']
            : (isset($data['patient']) && is_array($data['patient']) ? new Patient($data['patient']) : null);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'arrival_at' => $this->arrival_at,
            'state' => $this->state,
            'priority' => $this->priority,
            'symptoms' => $this->symptoms,
            'doctor_id' => $this->doctor_id,
            'doctor_name' => $this->doctor_name,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'patient' => $this->patient ? $this->patient->toArray() : null,
        ];
    }
}
