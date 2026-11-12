# E-mails do TáChegando

O modelo de confirmação utiliza um link de verificação do Supabase com `{{ .TokenHash }}` e redireciona, após validação, para `https://tachegandoapp.com.br/cadastro?modo=entrar`.

**Instalação:** copie o conteúdo do HTML correspondente para **Supabase → Autenticação → E-mails → Modelos → Confirmar cadastro**. O Supabase hospedado não utiliza automaticamente este arquivo do GitHub.

Em **Configuração de URL**, permita `https://tachegandoapp.com.br/cadastro?modo=entrar` e `https://tachegandoapp.com.br/recuperar`. Não use `app.tachegandoapp.com.br` sem configurar o subdomínio.

O redirecionamento abre o login na web. Abertura direta do aplicativo Android/iOS exigirá deep links verificados.
