<?php

namespace App\Models;

class Appointment
{
    public int $id;
    public string $paziente_nome;
    public string $cf;
    public string $priorita;
    public string $stato;
    public string $data_visita;
    public string $dottore;
    public string $parametri;
    public ?array $referto;
    public ?string $indirizzo;
    public ?string $citta;
    public ?string $telefono;
    public ?string $email;

    public function __construct(array $data)
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->paziente_nome = trim((string) ($data['paziente_nome'] ?? ''));
        $this->cf = strtoupper(trim((string) ($data['cf'] ?? '')));
        $this->priorita = (string) ($data['priorita'] ?? 'green');
        $this->stato = (string) ($data['stato'] ?? 'Registrato');
        $this->data_visita = (string) ($data['data_visita'] ?? date(DATE_ATOM));
        $this->dottore = (string) ($data['dottore'] ?? '-');
        $this->parametri = (string) ($data['parametri'] ?? '-');
        $this->referto = isset($data['referto']) && is_array($data['referto']) ? $data['referto'] : null;
        $this->indirizzo = $data['indirizzo'] ?? null;
        $this->citta = $data['citta'] ?? null;
        $this->telefono = $data['telefono'] ?? null;
        $this->email = $data['email'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'paziente_nome' => $this->paziente_nome,
            'cf' => $this->cf,
            'priorita' => $this->priorita,
            'stato' => $this->stato,
            'data_visita' => $this->data_visita,
            'dottore' => $this->dottore,
            'parametri' => $this->parametri,
            'referto' => $this->referto,
            'indirizzo' => $this->indirizzo,
            'citta' => $this->citta,
            'telefono' => $this->telefono,
            'email' => $this->email,
        ];
    }
}
