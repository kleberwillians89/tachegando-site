(function () {
  'use strict';
  const config = window.TCRealConfig;
  const byId = id => document.getElementById(id);
  const form = byId('cad-form');
  const loginForm = byId('login-form');
  const signup = byId('cad-signup');
  const panel = byId('success-panel');
  const status = byId('status');
  const productList = byId('products');
  const categories = ['Pães','Frutas','Salgados','Doces de padaria','Lanches naturais','Sorvetes','Temperos','Produtos de limpeza prontos'];
  let client;
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
    button.setAttribute('aria-busy', String(flag));
  }
  function addProduct(value = '') {
    if (productList.children.length >= 30) return;
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
        products.length < 1 || products.length > 30 || products.some(n=> !n || n.length>160) ||
        new Set(products.map(n=>n.toLocaleLowerCase('pt-BR'))).size !== products.length || phone.length > 32) {
      throw new Error('Revise o nome do negócio, a categoria e informe entre 1 e 30 produtos diferentes.');
    }
    return { name, business_name: business, category, products, phone };
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
  async function finalize(user) {
    if (!confirmed(user)) throw new Error('Confirme seu e-mail antes de finalizar seu cadastro.');
    const {data: profile, error: profileError} = await client.rpc('get_my_account_profile');
    if (profileError || !profile?.user_id || profile.user_id !== user.id) throw new Error('Ainda não foi possível recuperar seu perfil.');
    if (profile.role === 'consumer') {
      if (user.user_metadata?.role === 'consumer') {
        const {error} = await client.rpc('complete_my_profile', {p_kind:'consumer',p_name: safeText(user.user_metadata?.name) || 'Consumidor'});
        if (error) throw new Error('Seu cadastro foi criado, mas não foi possível concluir o perfil.');
      }
      done('Conta confirmada!', 'Você já pode entrar no aplicativo com o mesmo e-mail e senha.', []);
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
      done('Seu negócio está pronto!', 'Os produtos abaixo já estão vinculados à sua conta e estarão disponíveis no aplicativo.', data.products.map(p=>p.name));
    } else {
      done('Bem-vindo de volta!', 'Seu cadastro profissional está pronto. Entre no aplicativo com esta conta.', []);
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
      if (vendor) Object.assign(data, { business_name:vendor.business_name, category:vendor.category, phone:vendor.phone, onboarding_products:vendor.products });
      const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:config.confirmationUrl,data}});
      if (error) throw error;
      byId('password').value='';byId('password-confirm').value='';
      view('login'); byId('login-email').value=email;
      message('Se o endereço puder ser cadastrado, você receberá um e-mail de confirmação. Ao confirmar, o portal preparará seu negócio e produtos automaticamente. Depois é só entrar no aplicativo. Se houver algum problema, volte aqui e entre para concluir.');
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
      const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;
      const {data:userData,error:userError}=await client.auth.getUser();if(userError||!userData?.user)throw new Error('Não foi possível verificar sua conta.');
      await finalize(userData.user);
      byId('login-password').value='';
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
  byId('signout').addEventListener('click',async()=>{try{await client?.auth.signOut()}finally{view('login')}});
  byId('add-product').addEventListener('click',()=>addProduct());
  form.querySelectorAll('input[name=role]').forEach(input=>input.addEventListener('change',updateRole));
  byId('tab-criar').addEventListener('click',()=>view('signup'));
  byId('tab-entrar').addEventListener('click',()=>view('login'));
  addProduct();addProduct();updateRole();view(new URLSearchParams(location.search).get('modo')==='entrar'?'login':'signup');
  try {client=verifyConfig()} catch(error) {message(error.message,true);byId('submit-signup').disabled=true;byId('submit-login').disabled=true;}
})();