(function () {
  'use strict';
  const config = window.TCRealConfig;
  const byId = id => document.getElementById(id);
  const form = byId('cad-form');
  const loginForm = byId('login-form');
  const googleButton = byId('login-google');
  const signup = byId('cad-signup');
  const panel = byId('success-panel');
  const status = byId('status');
  const productList = byId('products');
  const categories = ['Pães','Frutas','Salgados','Doces de padaria','Lanches naturais','Sorvetes','Temperos','Produtos de limpeza prontos'];
  const googleRedirectPath = '/cadastro?modo=entrar';
  const googleStorageKey = 'tc:google-oauth:v1';
  const googlePendingKey = 'tc:google-login-pending:v1';
  let client;
  let googleClient;
  let visibleUserId;
  let busy = false;

  function message(text, isError = false) {
    status.hidden = !text;
    status.textContent = text || '';
    status.dataset.error = String(isError);
    if (text) status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function view(mode) {
    signup.hidden = mode !== 'signup';
    loginForm.hidden = mode !== 'login';
    panel.hidden = mode !== 'done';
    byId('tab-criar').setAttribute('aria-selected', String(mode === 'signup'));
    byId('tab-entrar').setAttribute('aria-selected', String(mode === 'login'));
    byId('titulo').textContent = mode === 'login' ? 'Entre na sua conta' : mode === 'done' ? 'Tudo pronto!' : 'Crie sua conta';
    if (mode !== 'done') message('');
  }
  function busyToggle(flag, button) {
    busy = flag;
    button.disabled = flag;
    googleButton.disabled = flag;
    button.setAttribute('aria-busy', String(flag));
  }
  function addProduct(value = '') {
    
    const row = document.createElement('div'); row.className = 'cad-product';
    const input = document.createElement('input');
    input.type = 'text'; input.maxLength = 160; input.required = true;
    input.placeholder = 'Ex.: Pão francês'; input.setAttribute('aria-label','Nome do produto');
    input.value = value;
    const remove = document.createElement('button'); remove.type = 'button';
    remove.textContent = '×'; remove.setAttribute('aria-label','Remover produto');
    remove.addEventListener('click', () => { if (productList.children.length > 1) row.remove(); else input.value=''; });
    row.append(input,remove); productList.append(row);
  }
  function role() { return form.querySelector('input[name=role]:checked').value; }
  function updateRole() { byId('business-fields').hidden = role() !== 'vendor'; }
  function safeText(value) { return String(value || '').trim(); }
  function readVendor() {
    const name = safeText(byId('name').value);
    const business = safeText(byId('business').value);
    const category = byId('category').value;
    const phone = safeText(byId('phone').value);
    const products = Array.from(productList.querySelectorAll('input')).map(i => safeText(i.value));
    if (!name || name.length > 160 || !business || business.length > 160 || !categories.includes(category) ||
        products.length < 1 || products.some(n=> !n || n.length>160) ||
        new Set(products.map(n=>n.toLocaleLowerCase('pt-BR'))).size !== products.length || phone.length > 32) {
      throw new Error('Revise o nome do negócio, a categoria e informe pelo menos um produto. Não repita nomes.');
    }
    return { name, business_name: business, category, products, phone };
  }
  // Additional products are a resumable local draft, not authorization data.
  // Supabase only receives a batch after the owner confirms the account and signs in.
  function draftKey(email) { return 'tc:catalogue-pending:v1:' + safeText(email).toLowerCase(); }
  function ensureDraftStorage(email, names) {
    try {
      const key = draftKey(email);
      const value = JSON.stringify(names);
      const previous = localStorage.getItem(key);
      localStorage.setItem(key, value);
      if (previous === null) localStorage.removeItem(key); else localStorage.setItem(key, previous);
    } catch {
      throw new Error('Não foi possível guardar seus produtos adicionais neste navegador. Tente liberar o armazenamento do site ou cadastre até 30 produtos inicialmente.');
    }
  }
  function saveDraft(email, names) {
    // Once Auth accepted the signup, never clear the only local copy.
    localStorage.setItem(draftKey(email), JSON.stringify(names));
  }
  function pendingDraft(email) {
    try {
      const value = JSON.parse(localStorage.getItem(draftKey(email)) || '[]');
      if (!Array.isArray(value)) throw new Error('Invalid draft');
      return value;
    } catch {
      throw new Error('Não foi possível recuperar os produtos adicionais. Entre novamente no navegador utilizado para o cadastro.');
    }
  }
  async function synchronizeDraft(email) {
    if (!email) return [];
    const items = pendingDraft(email);
    if (!items.length) return [];
    let saved = 0;
    for (let i = 0; i < items.length; i += 100) {
      const batch = items.slice(i, i + 100);
      const {data, error} = await client.rpc('append_my_vendor_products', {p_product_names: batch});
      if (error || !data || typeof data.product_count !== 'number') {
        // Preserve the remainder for a later login, even if earlier batches succeeded.
        localStorage.setItem(draftKey(email), JSON.stringify(items.slice(i)));
        throw new Error('Seu perfil está pronto, mas alguns produtos ainda não foram salvos. Volte a entrar neste navegador para continuar o envio.');
      }
      saved += batch.length;
      localStorage.setItem(draftKey(email), JSON.stringify(items.slice(i + batch.length)));
    }
    return items.slice(0, saved);
  }
  function verifyConfig() {
    if (!config || config.enabled !== true) throw new Error('O cadastro real está sendo preparado. Ainda não estamos recebendo inscrições por aqui.');
    if (typeof config.supabaseUrl !== 'string' || config.supabaseUrl !== 'https://vhnkezwjknwpddqhlnfk.supabase.co' ||
        !config.publishableKey?.startsWith('sb_publishable_') ||
        !window.supabase?.createClient) throw new Error('O serviço de cadastro ainda não está configurado.');
    return window.supabase.createClient(config.supabaseUrl, config.publishableKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
    });
  }
  function readableError(error) {
    const m = String(error?.message || '').toLowerCase();
    if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
    if (m.includes('invalid login credentials')) return 'E-mail ou senha não conferem.';
    if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Tente novamente mais tarde.';
    return 'Não foi possível concluir agora. Confira os dados e tente novamente.';
  }
  function confirmed(user) { return Boolean(user?.id && user.email_confirmed_at); }
  function metaProducts(user) {
    const data = user?.user_metadata || {};
    return Array.isArray(data.onboarding_products) ? data.onboarding_products : [];
  }
  async function finalize(user, method) {
    if (!confirmed(user)) throw new Error('Confirme seu e-mail antes de finalizar seu cadastro.');
    const {data: profile, error: profileError} = await client.rpc('get_my_account_profile');
    if (profileError || !profile?.user_id || profile.user_id !== user.id) throw new Error('Ainda não foi possível recuperar seu perfil.');
    if (profile.role === 'consumer') {
      const needsProfile = method === 'google' ? !profile.name : user.user_metadata?.role === 'consumer';
      if (needsProfile) {
        const name = safeText(user.user_metadata?.name || user.user_metadata?.full_name).slice(0, 160);
        const {error} = await client.rpc('complete_my_profile', {p_kind:'consumer',p_name: name || 'Consumidor'});
        if (error) throw new Error('Seu cadastro foi criado, mas não foi possível concluir o perfil.');
      }
      if (method === 'google') {
        done('Você entrou com Google!', 'Sua conta do Tá Chegando está conectada.', []);
      } else {
        done('Conta confirmada!', 'Você já pode entrar no aplicativo com o mesmo e-mail e senha.', []);
      }
      return;
    }
    if (profile.role !== 'vendor' && profile.role !== 'vendor_incomplete') throw new Error('Perfil não reconhecido.');
    const meta = user.user_metadata || {};
    const names = metaProducts(user);
    if (profile.role === 'vendor_incomplete' && (safeText(meta.role) !== 'vendor' || !names.length)) {
      throw new Error('Falta o catálogo inicial. Entre em contato com o suporte para finalizar seu cadastro.');
    }
    if (names.length) {
      const {data, error} = await client.rpc('complete_vendor_onboarding', {
        p_name: safeText(meta.name || profile.name),
        p_business_name: safeText(meta.business_name || profile.business_name),
        p_category: safeText(meta.category || profile.category),
        p_product_names: names,
        p_phone: safeText(meta.phone) || null
      });
      if (error) throw new Error('Sua conta foi confirmada, mas o catálogo não foi salvo. Tente entrar novamente.');
      if (!data?.profile?.vendor_id || !Array.isArray(data.products)) throw new Error('Cadastro não confirmado pelo servidor.');
      const extra = await synchronizeDraft(user.email);
      done('Seu negócio está pronto!', extra.length
        ? 'Seus produtos foram salvos. Você já pode entrar no aplicativo com esta conta.'
        : 'Os produtos abaixo já estão vinculados à sua conta e estarão disponíveis no aplicativo.',
        data.products.map(p=>p.name).concat(extra));
    } else {
      const extra = await synchronizeDraft(user.email);
      done('Bem-vindo de volta!', extra.length
        ? 'Os produtos adicionais foram salvos. Entre no aplicativo com esta conta.'
        : 'Seu cadastro profissional está pronto. Entre no aplicativo com esta conta.', extra);
    }
  }
  function done(title, msg, products) {
    view('done');
    byId('success-title').textContent = title;
    byId('success-message').textContent = msg;
    const list = byId('success-products'); list.replaceChildren();
    if (products.length) {
      const ul = document.createElement('ul');
      for (const product of products) { const li=document.createElement('li');li.textContent=product;ul.append(li); }
      list.append(ul);
    }
    message('');
  }
  async function verifyAndFinalize(method, expectedUserId) {
    const {data, error} = await client.auth.getUser();
    const user = data?.user;
    if (error || !user?.id || user.id !== expectedUserId) {
      throw new Error('Não foi possível verificar sua conta.');
    }
    await finalize(user, method);
    visibleUserId = user.id;
  }
  function createGoogleClient() {
    // Isola o verificador PKCE no navegador que iniciou o fluxo e preserva os links de e-mail existentes.
    googleClient ??= window.supabase.createClient(config.supabaseUrl, config.publishableKey, {
      auth: {
        flowType: 'pkce',
        storage: sessionStorage,
        storageKey: googleStorageKey,
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    return googleClient;
  }
  const googleFailure = 'Não foi possível entrar com Google. Tente novamente ou use e-mail e senha.';
  function clearGoogleAttempt() {
    try {
      sessionStorage.removeItem(googlePendingKey);
      sessionStorage.removeItem(googleStorageKey);
    } catch { /* Armazenamento indisponível. */ }
  }
  async function startGoogleLogin() {
    if (busy || !client) return;
    busyToggle(true, googleButton);
    message('Preparando a entrada com Google…');
    try {
      const response = await fetch(config.supabaseUrl + '/auth/v1/settings', {
        headers: {apikey: config.publishableKey},
        cache: 'no-store'
      });
      if (!response.ok) throw new Error();
      const settings = await response.json();
      if (settings.external?.google !== true) {
        message('O login com Google ainda não está disponível. Você pode entrar com e-mail e senha.', true);
        busyToggle(false, googleButton);
        return;
      }
      const redirectTo = new URL(googleRedirectPath, location.origin).href;
      const {data, error} = await createGoogleClient().auth.signInWithOAuth({
        provider: 'google',
        options: {redirectTo, skipBrowserRedirect: true, queryParams: {prompt: 'select_account'}}
      });
      if (error || !data?.url) throw new Error();
      sessionStorage.setItem(googlePendingKey, '1');
      location.assign(data.url);
    } catch {
      clearGoogleAttempt();
      message(googleFailure, true);
      busyToggle(false, googleButton);
    }
  }
  async function handleGoogleReturn(query) {
    const fragment = new URLSearchParams(location.hash.slice(1));
    const error = query.get('error') || fragment.get('error');
    const codes = query.getAll('code');
    if (!error && !codes.length) return;

    history.replaceState(history.state, '', googleRedirectPath);
    busyToggle(true, googleButton);
    try {
      const pending = sessionStorage.getItem(googlePendingKey);
      sessionStorage.removeItem(googlePendingKey);
      if (error === 'access_denied' && pending) {
        message('Login com Google cancelado. Você pode tentar novamente.', true);
        return;
      }
      if (error || !pending || codes.length !== 1 || !codes[0]) throw new Error();
      message('Verificando sua conta…');
      const flowId = query.get('sb_flow_id');
      const {data, error: exchangeError} = await createGoogleClient().auth.exchangeCodeForSession(
        codes[0], flowId ? {flowId} : undefined
      );
      const session = data?.session;
      if (exchangeError || !session?.user?.id || !session.access_token || !session.refresh_token) throw new Error();
      const {error: sessionError} = await client.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      if (sessionError) throw new Error();
      await verifyAndFinalize('google', session.user.id);
    } catch {
      message(googleFailure, true);
    } finally {
      clearGoogleAttempt();
      busyToggle(false, googleButton);
    }
  }
  form.addEventListener('submit', async e=>{
    e.preventDefault(); if (busy) return;
    const button=byId('submit-signup');
    try {
      if (!client) client=verifyConfig();
      if (!byId('terms').checked) throw new Error('É necessário aceitar os Termos e a Política de Privacidade.');
      const name=safeText(byId('name').value);
      const email=safeText(byId('email').value);
      const password=byId('password').value;
      if (!name || name.length>160 || !/^\S+@\S+\.\S+$/.test(email) || password.length<8 || password.length>128 || password!==byId('password-confirm').value) {
        throw new Error('Confira nome, e-mail e senha. A senha precisa ter de 8 a 128 caracteres e as duas senhas devem coincidir.');
      }
      const kind=role();
      const vendor=kind==='vendor'?readVendor():null;
      busyToggle(true,button); message('Criando sua conta…');
      const data={registration_contract:'web-v1',name,full_name:name,role:kind};
      if (vendor) {
        // Auth metadata is intentionally small; additional catalogue items are stored
        // locally until this same browser signs in with a verified account.
        if (vendor.products.length > 30) ensureDraftStorage(email, vendor.products.slice(30));
        Object.assign(data, { business_name:vendor.business_name, category:vendor.category, phone:vendor.phone, onboarding_products:vendor.products.slice(0, 30) });
      }
      const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:config.confirmationUrl,data}});
      if (error) throw error;
      if (vendor && vendor.products.length > 30) saveDraft(email, vendor.products.slice(30));
      byId('password').value='';byId('password-confirm').value='';
      view('login'); byId('login-email').value=email;
      message('Se o endereço puder ser cadastrado, você receberá um e-mail de confirmação. Depois de confirmar seu e-mail, volte a este site e entre para concluir seu perfil e salvar os produtos. A mesma conta servirá no aplicativo. Se você informou mais de 30 produtos, volte para entrar neste mesmo navegador para salvar os demais.');
    } catch (err) { message(err instanceof Error && !String(err.message).includes('Auth') ? err.message : readableError(err),true); }
    finally { busyToggle(false,button); }
  });
  loginForm.addEventListener('submit',async e=>{
    e.preventDefault();if(busy)return;
    const button=byId('submit-login');
    try {
      if(!client)client=verifyConfig();
      const email=safeText(byId('login-email').value),password=byId('login-password').value;
      if(!email || !password)throw new Error('Informe seu e-mail e sua senha.');
      busyToggle(true,button); message('Entrando e preparando seu cadastro…');
      const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;
      byId('login-password').value='';
      await verifyAndFinalize('password', data?.user?.id);
    }catch(err){message(err.message?.startsWith('Não') || err.message?.startsWith('Confirme') || err.message?.startsWith('Falta') ? err.message : readableError(err),true)}
    finally{busyToggle(false,button)}
  });
  byId('forgot').addEventListener('click',async()=>{
    try {if(!client)client=verifyConfig();const email=safeText(byId('login-email').value);if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('Informe seu e-mail antes de recuperar a senha.');
      const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:config.recoveryUrl});if(error)throw error;
      message('Se a conta existir, você receberá instruções para redefinir a senha.');
    }catch(err){message(err.message?.startsWith('Informe')?err.message:readableError(err),true)}
  });
  byId('resend').addEventListener('click',async()=>{
    try {if(!client)client=verifyConfig();const email=safeText(byId('login-email').value);if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('Informe seu e-mail antes de reenviar.');
      const {error}=await client.auth.resend({type:'signup',email,options:{emailRedirectTo:config.confirmationUrl}});if(error)throw error;
      message('Se sua conta ainda precisar de confirmação, enviaremos uma nova mensagem.');
    }catch(err){message(err.message?.startsWith('Informe')?err.message:readableError(err),true)}
  });
  googleButton.addEventListener('click', startGoogleLogin);
  window.addEventListener('pageshow', event => {
    if (event.persisted && googleButton.getAttribute('aria-busy') === 'true') {
      clearGoogleAttempt();
      busyToggle(false, googleButton);
      message('Você pode tentar entrar com Google novamente.');
    }
  });
  function clearAccountView() {
    visibleUserId = null;
    byId('success-products').replaceChildren();
    view('login');
  }
  byId('signout').addEventListener('click', async () => {
    if (busy || !client) return;
    const button = byId('signout');
    busyToggle(true, button);
    try {
      const {error} = await client.auth.signOut({scope: 'local'});
      if (error) throw error;
      clearAccountView();
    } catch {
      message('Não foi possível confirmar a saída. Tente novamente.', true);
    } finally {
      busyToggle(false, button);
    }
  });
  byId('add-product').addEventListener('click',()=>addProduct());
  form.querySelectorAll('input[name=role]').forEach(input=>input.addEventListener('change',updateRole));
  byId('tab-criar').addEventListener('click',()=>view('signup'));
  byId('tab-entrar').addEventListener('click',()=>view('login'));
  const query = new URLSearchParams(location.search);
  addProduct();updateRole();view(query.get('modo')==='entrar'?'login':'signup');
  try {
    client = verifyConfig();
    googleButton.disabled = false;
    client.auth.onAuthStateChange((event, session) => {
      if (!visibleUserId) return;
      if (event === 'SIGNED_OUT' || (session?.user?.id && session.user.id !== visibleUserId)) {
        clearAccountView();
        if (!busy) message('Sua sessão terminou ou mudou. Entre novamente.', true);
      }
    });
    if (query.get('modo') === 'entrar') void handleGoogleReturn(query);
  } catch (error) {
    message(error.message, true);
    byId('submit-signup').disabled = true;
    byId('submit-login').disabled = true;
    googleButton.disabled = true;
  }
})();
