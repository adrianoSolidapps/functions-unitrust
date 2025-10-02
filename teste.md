Próximo passo (no mesmo Console):

Method: POST
Endpoint: functions/scheduleOnList
Use Master Key: True

Body:

{
  "itensList": [
    { "agent_name": "Tester One", "agent_state": "TX", "bubble_id": "test-001" }
  ],
  "functionName": "createActivityReport",
  "mapping": {},
  "scheduleDate": null,
  "intervalSeconds": 0
}

Depois, vá em Database > Browser e filtre em ActivityReport por bubble_id = test-001.