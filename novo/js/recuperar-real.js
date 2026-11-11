(() => {
'use strict';
const config = window.TCRealConfig, status = document.getElementById('status'), form = document.getElementById('reset-form'), submit = document.getElementById('submit-reset');
let client, ready = false;
const show = (msg, error=false) => {status.hidden=false;status.textContent=msg;status.dataset.error=String(error);};
const enable = () => {ready=true;form.hidden=false;document.getElementById('help').textContent='Informe a nova senha para sua conta.';};
async function init() {
 if (!config?.enabled || !config?.publishableKey?.startsWith('sb_publishable_') || !window.supabase?.createClient) {show('A recuperação ainda está sendo configurada.',true);return;}
 client = window.supabase.createClient(config.supabaseUrl,config.publishableKey,{auth:{detectSessionInUrl:true,autoRefreshToken:true,persistSession:true}});
 client.auth.onAuthStateChange((event,session) => {if(event==='PASSWORD_RECOVERY'&&session)enable();});
 try {
  const hash=new URLSearchParams(location.hash.slice(1)), query=new URLSearchParams(location.search);
  if(hash.get('error')) {show('O link expirou ou não pôde ser validado. Solicite outro na tela de entrada.',true);return;}
  if(query.get('token_hash')&&query.get('type')==='recovery') {
   const {error}=await client.auth.verifyOtp({token_hash:query.get('token_hash'),type:'recovery'});if(error)throw error;
   enable();return;
  }
  const {data,error}=await client.auth.getSession();if(error)throw error;
  if(data?.session&&(hash.has('access_token')||query.has('code')))enable();
  else if(!ready)show('Abra o link recebido por e-mail para redefinir sua senha.',true);
 } catch {show('Este link expirou ou não é válido. Solicite outro na tela de entrada.',true);}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!ready||submit.disabled)return;
 const password=document.getElementById('new-password').value;
 if(password.length<8||password.length>128||password!==document.getElementById('confirm-password').value) {show('Informe duas senhas iguais com 8 a 128 caracteres.',true);return;}
 submit.disabled=true;
 try {const {error}=await client.auth.updateUser({password});if(error)throw error;await client.auth.signOut();form.hidden=true;show('Senha atualizada. Agora você pode entrar com a nova senha.');}
 catch {show('Não foi possível atualizar. Solicite um novo link de recuperação.',true);}
 finally {submit.disabled=false;}
});
init();
})();