O que eu adriano preciso fazer atribuido pelo lider Nailan:

Criar função Schedule Workflow on a list:

Recebe:
ItensList: Lista de itens
Function: Função para executar
Mapear qual dado do item vai ser passado para função recebida e executar para cada um da lista
ScheduleDate: Data de inicio das execuções
Interval: Intervalo entre as execuções

"Schedule API Workflow on a list"
Testar essa funcao criando uma outra função basica para gravar dados na tabela do back4app
Executar funcao CreateActivityReport na lista do CSV que te enviei
Receber a lista de dados e executar a função para criar cada um a partir de uma Data X com intervalo Y

Sobre as funcoes de CRIAR, ALTERAR e DELETAR temos que ter no Cloud Code também pq vamos usar em LOTE com essa funcao ai que te passei primemiro (editado) 


O que o time no contexto está fazendo:

@Jean Moura está trabalhando para ajustar o middleware para usarmos nos Searchs
Subir no cloud code e enviar exemplos de uso

@Adriano criou a tabela e está trabalhando na função "Schedule API Workflow on a list" recebendo parametros
Testar essa funcao criando uma outra função basica (CreateActitivyReport) para gravar dados (CSV enviado) na tabela do back4app
Receber uma lista de dados e executar a função para criar cada um a partir de uma Data X com intervalo Y

@Nailan criei o lucid básico com a estrutura de WFs que temos que migrar e estou criando a função do Step 1 para ser chamada na função do Adriano
Consegui colocar uma versão básica do middleware para funcionar no cloud code do nosso app back4app, passei pro Jean prosseguir com essa parte

Mapeamento das funções que precisamos criar:
Schedule API Workflow
Schedule API Workflow on a list
Create new thing - back4app database
Make changes to a thing - back4app database
Delete thing - back4app database
Conditional Check (aqui pensei em fazermos uma função genérica que recebe parametros para as condicionais)
API Workflows
refreshActivityReport1
refreshActivityReport2 (verificar necessida, pois atualmente é para o looping)
ActivityReportRouter
Create_ActivityReport_User
RefreshBI
Create_BI_Report
