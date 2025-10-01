Back4App Cloud Code — Scheduler em lote

Funções adicionadas
- writeTest: grava uma mensagem em `Test`.
- createActivityReport: cria/atualiza registros em `ActivityReport` (usa `bubble_id` como chave).
- scheduleOnList: agenda execuções de uma função para uma lista, a partir de `scheduleDate` com `intervalSeconds`.

Exemplos (Parse Dashboard > Cloud > Functions)
1) writeTest
{
  "message": "hello"
}

2) scheduleOnList com createActivityReport
{
  "itensList": [
    {
      "agent_name": "John Doe",
      "agent_state": "TX",
      "bubble_id": "demo-1"
    }
  ],
  "functionName": "createActivityReport",
  "mapping": {},
  "scheduleDate": "2025-10-01T14:10:00Z",
  "intervalSeconds": 1
}

Mapeamento
- Se `mapping` estiver vazio, o item inteiro é enviado como payload.
- Para mapear campos específicos, use: { "targetField": "path.no.item" }.

Notas
- Campos de data do CSV `Created Date`/`Modified Date` são ignorados (Parse gera `createdAt`/`updatedAt`).
- `_id` do CSV deve ser enviado como `bubble_id`.


