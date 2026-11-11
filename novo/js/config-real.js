/* Configure apenas na versão Preview antes de ativar em produção.
 * SUPABASE_PUBLISHABLE_KEY é pública; NUNCA use sb_secret_ ou service_role.
 * O site atual continua no modo protótipo até a ativação autorizada.
 */
window.TCRealConfig = Object.freeze({
  enabled: true,
  supabaseUrl: 'https://vhnkezwjknwpddqhlnfk.supabase.co',
  publishableKey: 'sb_publishable_s_VPZ1wyZIbsxZ6re6s_5Q_ZIH4ER9V',
  confirmationUrl: 'https://tachegando-site.vercel.app/cadastro?modo=entrar',
  recoveryUrl: 'https://tachegando-site.vercel.app/recuperar'
});