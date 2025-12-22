<?php

namespace App\Repositories;

use App\Models\Appointment;

class AppointmentRepository
{
    private JsonStorage $storage;

    public function __construct(JsonStorage $storage)
    {
        $this->storage = $storage;
        $this->boot();
    }

    public function all(): array
    {
        return array_map(fn ($row) => new Appointment($row), $this->storage->read());
    }

    public function find(int $id): ?Appointment
    {
        foreach ($this->storage->read() as $row) {
            if ((int) ($row['id'] ?? 0) === $id) {
                return new Appointment($row);
            }
        }
        return null;
    }

    public function create(Appointment $appointment): Appointment
    {
        $rows = $this->storage->read();
        $rows[] = $appointment->toArray();
        $this->storage->write($rows);
        return $appointment;
    }

    public function update(int $id, Appointment $appointment): ?Appointment
    {
        $rows = $this->storage->read();
        $updated = null;
        foreach ($rows as $index => $row) {
            if ((int) ($row['id'] ?? 0) === $id) {
                $rows[$index] = $appointment->toArray();
                $updated = $appointment;
                break;
            }
        }

        if ($updated) {
            $this->storage->write($rows);
        }

        return $updated;
    }

    public function delete(int $id): bool
    {
        $rows = $this->storage->read();
        $filtered = array_filter($rows, fn ($row) => (int) ($row['id'] ?? 0) !== $id);

        if (count($filtered) === count($rows)) {
            return false;
        }

        $this->storage->write(array_values($filtered));
        return true;
    }

    private function boot(): void
    {
        if ($this->storage->exists() && $this->storage->read()) {
            return;
        }

        $seed = $this->seedData();
        $this->storage->write($seed);
    }

    private function seedData(): array
    {
        $now = time();
        return [
            [
                'id' => 1055,
                'paziente_nome' => 'Bianchi Luigi',
                'cf' => 'BNCLGU80A01H501U',
                'priorita' => 'red',
                'stato' => 'In Visita',
                'data_visita' => date(DATE_ATOM, $now - 1800),
                'dottore' => 'Dr. House (Cardiologia)',
                'parametri' => 'PA 140/90, FC 110',
                'indirizzo' => 'Via delle Rose 15',
                'citta' => 'Roma',
                'telefono' => '3339998877',
                'email' => 'l.bianchi@email.it',
            ],
            [
                'id' => 1054,
                'paziente_nome' => 'Verdi Mario',
                'cf' => 'VRDMRA90B12L219K',
                'priorita' => 'orange',
                'stato' => 'Attesa Esiti',
                'data_visita' => date(DATE_ATOM, $now - 3600),
                'dottore' => 'Dr. Rossi (Med. Gen)',
                'parametri' => 'Dolore toracico',
                'referto' => [
                    'esito' => 'Sospetta angina',
                    'terapia' => 'Attesa troponina',
                    'allegati' => [],
                ],
            ],
            [
                'id' => 1053,
                'paziente_nome' => 'Neri Giulia',
                'cf' => 'NRIGLI95C45H501Z',
                'priorita' => 'green',
                'stato' => 'Refertato',
                'data_visita' => date(DATE_ATOM, $now - 7200),
                'dottore' => 'Dr. Grey (Ortopedia)',
                'parametri' => 'Trauma caviglia',
                'referto' => [
                    'esito' => 'Distorsione semplice. No fratture.',
                    'terapia' => 'Ghiaccio e riposo 5gg.',
                    'allegati' => [],
                ],
                'indirizzo' => 'Corso Italia 1',
                'citta' => 'Milano',
            ],
            [
                'id' => 1052,
                'paziente_nome' => 'Gialli Luca',
                'cf' => 'GLLLCU70E10F205A',
                'priorita' => 'white',
                'stato' => 'Registrato',
                'data_visita' => date(DATE_ATOM, $now - 20000),
                'dottore' => '-',
                'parametri' => '-',
            ],
            [
                'id' => 1051,
                'paziente_nome' => 'Rosa Anna',
                'cf' => 'RSANNA82M50L219Q',
                'priorita' => 'orange',
                'stato' => 'OBI',
                'data_visita' => date(DATE_ATOM, $now - 1200),
                'dottore' => 'Dr. House',
                'parametri' => 'Osservazione dolore addominale',
            ],
        ];
    }
}
