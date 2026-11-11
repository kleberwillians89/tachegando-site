/* Configure apenas na versão Preview antes de ativar em produção.
 * SUPABASE_PUBLISHABLE_KEY é pública; NUNCA use sb_secret_ ou service_role.
 * O site atual continua no modo protótipo até a ativação autorizada.
 */
window.TCRealConfig = Object.freeze({
  enabled: false,
  supabaseUrl: 'https://vhnkezwjknwpddqhlnfk.supabase.co',
  publishableKey: '',
  confirmationUrl: 'https://app.tachegandoapp.com.br/auth/confirm',
  recoveryUrl: 'https://app.tachegandoapp.com.br/auth/recovery'
});