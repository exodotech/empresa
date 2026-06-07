/* ============================================================
   EXODO TECH - SPA logic for Netlify
   - Local Global Blueprint engine
   - Netlify Function lead capture
   - DDI auto-selection and local retry queue
   ============================================================ */

const CONTACT_ENDPOINT = window.EXODO_CONTACT_ENDPOINT || '/.netlify/functions/send-email';
const SUPPORT_EMAIL = 'geral@exodotech.com';
const LEAD_QUEUE_KEY = 'exodo-tech:pending-leads:v1';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

/* --- i18n ---------------------------------------------------- */
function applyLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = 'pt';
    CURRENT_LANG = lang;
    try { localStorage.setItem('exodo-lang', lang); } catch (e) {}
    document.documentElement.lang = lang;

    $$('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const value = I18N[lang][key];
        if (value != null) el.innerHTML = value;
    });

    $$('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        const value = I18N[lang][key];
        if (value != null) el.setAttribute('placeholder', value);
    });

    if (I18N[lang]['meta.title']) document.title = I18N[lang]['meta.title'];

    const current = $('#lang-current');
    if (current) current.textContent = lang.toUpperCase();

    $$('.lang-opt').forEach(button => {
        button.classList.toggle('active', button.getAttribute('onclick').includes("'" + lang + "'"));
    });

    populateCountryCodes(getSelectedCountryIso());
}

function toggleLangMenu() {
    const menu = $('#lang-menu');
    if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function setLanguage(lang) {
    applyLanguage(lang);
    const menu = $('#lang-menu');
    if (menu) menu.style.display = 'none';
}

document.addEventListener('click', (event) => {
    const button = $('#lang-btn');
    const menu = $('#lang-menu');
    if (menu && button && !button.contains(event.target) && !menu.contains(event.target)) {
        menu.style.display = 'none';
    }
});

/* --- Splash -------------------------------------------------- */
function partTheSea() {
    const gate = $('#splash-gate');
    const main = $('#main-site');
    if (!gate || !main) return;

    gate.classList.add('gate-parting');
    setTimeout(() => {
        main.classList.add('visible');
        $('#mobile-cta')?.classList.add('show');
    }, 400);

    setTimeout(() => {
        gate.style.transition = 'opacity .6s ease';
        gate.style.opacity = '0';
        gate.style.pointerEvents = 'none';
        setTimeout(() => gate.remove(), 650);
    }, 1400);
}

/* --- Alert --------------------------------------------------- */
let alertTimer = null;

function showAlert(title, message) {
    const titleEl = $('#alert-title');
    const messageEl = $('#alert-message');
    const alertEl = $('#custom-alert');
    if (!titleEl || !messageEl || !alertEl) return;

    titleEl.textContent = title;
    messageEl.textContent = message;
    alertEl.classList.add('show');
    if (alertTimer) clearTimeout(alertTimer);
    alertTimer = setTimeout(hideAlert, 6500);
}

function hideAlert() {
    $('#custom-alert')?.classList.remove('show');
}

/* --- Tabs and diagnostics ----------------------------------- */
function switchTab(tab) {
    const next = tab === 'blueprint' ? 'blueprint' : 'form';
    ['form', 'blueprint'].forEach(name => {
        const button = $('#btn-tab-' + name);
        const panel = $('#panel-' + name);
        if (!button || !panel) return;
        button.classList.toggle('active', name === next);
        panel.classList.toggle('hidden', name !== next);
    });
    resetDiagnostics();
}

function resetDiagnostics() {
    const bar = $('#metric-1-bar');
    const value = $('#metric-1-value');
    if (bar) bar.style.width = '0%';
    if (value) value.textContent = '0%';

    ['metric-1', 'metric-2', 'metric-3'].forEach(id => {
        $('#' + id)?.classList.remove('lit-cyan', 'lit-green', 'lit-gold');
    });

    $('#metric-2-pill')?.classList.remove('show');
    $('#metric-3-pill')?.classList.remove('show');
    $('#sim-console')?.classList.remove('active');

    const consoleText = $('#sim-console-text');
    if (consoleText) consoleText.textContent = t('console.ready');
}

function runDiagnostics() {
    const bar = $('#metric-1-bar');
    const value = $('#metric-1-value');
    const m1 = $('#metric-1');
    const m2 = $('#metric-2');
    const m3 = $('#metric-3');
    const p2 = $('#metric-2-pill');
    const p3 = $('#metric-3-pill');
    const consoleBox = $('#sim-console');
    const consoleText = $('#sim-console-text');
    if (!bar || !value || !consoleText) return;

    bar.style.width = '0%';
    value.textContent = '0%';
    [m1, m2, m3].forEach(card => card?.classList.remove('lit-cyan', 'lit-green', 'lit-gold'));
    p2?.classList.remove('show');
    p3?.classList.remove('show');
    consoleBox?.classList.add('active');

    setTimeout(() => {
        consoleText.textContent = t('js.diag1');
        m1?.classList.add('lit-cyan');
        bar.style.width = '85%';
        let current = 0;
        const tick = setInterval(() => {
            current += 3;
            if (current >= 85) {
                current = 85;
                clearInterval(tick);
            }
            value.textContent = current + '%';
        }, 45);
    }, 200);

    setTimeout(() => {
        consoleText.textContent = t('js.diag2');
        m2?.classList.add('lit-green');
        p2?.classList.add('show');
    }, 1500);

    setTimeout(() => {
        consoleText.textContent = t('js.diag3');
        m3?.classList.add('lit-gold');
        p3?.classList.add('show');
    }, 2400);

    setTimeout(() => {
        consoleText.textContent = t('js.diag4');
    }, 3200);
}

/* --- Country calling codes ---------------------------------- */
const COUNTRY_DIALS = 'AF:93,AX:358,AL:355,DZ:213,AS:1684,AD:376,AO:244,AI:1264,AG:1268,AR:54,AM:374,AW:297,AU:61,AT:43,AZ:994,BS:1242,BH:973,BD:880,BB:1246,BY:375,BE:32,BZ:501,BJ:229,BM:1441,BT:975,BO:591,BQ:599,BA:387,BW:267,BR:55,IO:246,VG:1284,BN:673,BG:359,BF:226,BI:257,CV:238,KH:855,CM:237,CA:1,KY:1345,CF:236,TD:235,CL:56,CN:86,CX:61,CC:61,CO:57,KM:269,CG:242,CD:243,CK:682,CR:506,CI:225,HR:385,CU:53,CW:599,CY:357,CZ:420,DK:45,DJ:253,DM:1767,DO:1809,EC:593,EG:20,SV:503,GQ:240,ER:291,EE:372,SZ:268,ET:251,FK:500,FO:298,FJ:679,FI:358,FR:33,GF:594,PF:689,GA:241,GM:220,GE:995,DE:49,GH:233,GI:350,GR:30,GL:299,GD:1473,GP:590,GU:1671,GT:502,GG:44,GN:224,GW:245,GY:592,HT:509,HN:504,HK:852,HU:36,IS:354,IN:91,ID:62,IR:98,IQ:964,IE:353,IM:44,IL:972,IT:39,JM:1876,JP:81,JE:44,JO:962,KZ:7,KE:254,KI:686,XK:383,KW:965,KG:996,LA:856,LV:371,LB:961,LS:266,LR:231,LY:218,LI:423,LT:370,LU:352,MO:853,MG:261,MW:265,MY:60,MV:960,ML:223,MT:356,MH:692,MQ:596,MR:222,MU:230,YT:262,MX:52,FM:691,MD:373,MC:377,MN:976,ME:382,MS:1664,MA:212,MZ:258,MM:95,NA:264,NR:674,NP:977,NL:31,NC:687,NZ:64,NI:505,NE:227,NG:234,NU:683,NF:672,KP:850,MK:389,MP:1670,NO:47,OM:968,PK:92,PW:680,PS:970,PA:507,PG:675,PY:595,PE:51,PH:63,PN:64,PL:48,PT:351,PR:1787,QA:974,RE:262,RO:40,RU:7,RW:250,BL:590,SH:290,KN:1869,LC:1758,MF:590,PM:508,VC:1784,WS:685,SM:378,ST:239,SA:966,SN:221,RS:381,SC:248,SL:232,SG:65,SX:1721,SK:421,SI:386,SB:677,SO:252,ZA:27,KR:82,SS:211,ES:34,LK:94,SD:249,SR:597,SJ:47,SE:46,CH:41,SY:963,TW:886,TJ:992,TZ:255,TH:66,TL:670,TG:228,TK:690,TO:676,TT:1868,TN:216,TR:90,TM:993,TC:1649,TV:688,UG:256,UA:380,AE:971,GB:44,US:1,UY:598,VI:1340,UZ:998,VU:678,VA:39,VE:58,VN:84,WF:681,EH:212,YE:967,ZM:260,ZW:263'
    .split(',')
    .map(entry => {
        const [iso, dial] = entry.split(':');
        return { iso, dial: '+' + dial };
    });

const COUNTRY_NAME_FALLBACK = {
    AX: 'Aland Islands',
    BQ: 'Caribbean Netherlands',
    IO: 'British Indian Ocean Territory',
    XK: 'Kosovo'
};

let countryTouched = false;

function getDisplayName(iso) {
    try {
        const names = new Intl.DisplayNames([CURRENT_LANG || 'pt'], { type: 'region' });
        return names.of(iso) || COUNTRY_NAME_FALLBACK[iso] || iso;
    } catch (e) {
        return COUNTRY_NAME_FALLBACK[iso] || iso;
    }
}

function getSelectedCountryIso() {
    const select = $('#form-country-code');
    return select?.selectedOptions?.[0]?.dataset.country || select?.value || 'PT';
}

function populateCountryCodes(selectedIso = 'PT') {
    const select = $('#form-country-code');
    if (!select) return;

    const preferred = ['PT', 'BR', 'US', 'GB', 'ES', 'FR', 'AO', 'MZ', 'CV'];
    const byIso = new Map(COUNTRY_DIALS.map(country => [country.iso, country]));
    const sorted = COUNTRY_DIALS
        .filter(country => !preferred.includes(country.iso))
        .sort((a, b) => getDisplayName(a.iso).localeCompare(getDisplayName(b.iso), CURRENT_LANG || 'pt'));
    const ordered = preferred.map(iso => byIso.get(iso)).filter(Boolean).concat(sorted);

    select.innerHTML = '';
    ordered.forEach(country => {
        const option = document.createElement('option');
        option.value = country.iso;
        option.dataset.country = country.iso;
        option.dataset.dial = country.dial;
        option.textContent = `${getDisplayName(country.iso)} ${country.dial}`;
        select.appendChild(option);
    });

    select.value = byIso.has(selectedIso) ? selectedIso : 'PT';
}

function setSelectedCountry(iso) {
    const select = $('#form-country-code');
    if (!select || !iso) return;
    const next = String(iso).toUpperCase();
    if (COUNTRY_DIALS.some(country => country.iso === next)) {
        select.value = next;
    }
}

async function detectVisitorCountry() {
    const browserIso = (navigator.language || '').split('-')[1];
    setSelectedCountry(browserIso || 'PT');

    try {
        const response = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        if (!response.ok) throw new Error('geo ' + response.status);
        const data = await response.json();
        if (!countryTouched) setSelectedCountry(data.country_code || data.country);
    } catch (e) {
        // The selector already has a sensible fallback.
    }
}

/* --- Contact form ------------------------------------------- */
function getSelectedContactMethod() {
    return document.querySelector('input[name="contact-method"]:checked')?.value || 'whatsapp';
}

function updateContactFields() {
    const method = getSelectedContactMethod();
    const phoneWrap = $('#phone-contact-fields');
    const emailWrap = $('#email-contact-field');
    const phoneInput = $('#form-phone-number');
    const emailInput = $('#form-email-contact');

    const usePhone = method === 'whatsapp';
    if (phoneWrap) phoneWrap.hidden = !usePhone;
    if (emailWrap) emailWrap.hidden = usePhone;
    if (phoneInput) phoneInput.required = usePhone;
    if (emailInput) emailInput.required = !usePhone;
}

function setFormStatus(type, message) {
    const status = $('#form-status');
    if (!status) return;
    status.className = `form-message ${type || ''}`.trim();
    status.innerHTML = message || '';
    status.hidden = !message;
}

function setProposalSending(isSending) {
    const button = $('#proposal-form button[type="submit"]');
    const label = $('#proposal-submit-label');
    if (button) button.disabled = isSending;
    if (label) label.textContent = isSending ? t('form.sending') : t('form.btn');
}

function sanitizePhone(value) {
    const raw = String(value || '').trim();
    if (/[a-zA-ZÀ-ÿ]/.test(raw)) return null;
    const digits = raw.replace(/\D/g, '');
    return digits.length >= 6 ? digits : null;
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

function collectContactDetails() {
    const method = getSelectedContactMethod();
    if (method === 'email') {
        const email = $('#form-email-contact')?.value.trim() || '';
        if (!isValidEmail(email)) return { ok: false, message: t('form.invalidEmail') };
        return {
            ok: true,
            method,
            label: t('form.contact.email'),
            value: email,
            final: `${t('form.contact.email')}: ${email}`
        };
    }

    const select = $('#form-country-code');
    const selected = select?.selectedOptions?.[0];
    const dial = selected?.dataset.dial || '+351';
    const iso = selected?.dataset.country || 'PT';
    const digits = sanitizePhone($('#form-phone-number')?.value);
    if (!digits) return { ok: false, message: t('form.invalidPhone') };

    return {
        ok: true,
        method,
        label: t('form.contact.whatsapp'),
        country: iso,
        countryCode: dial,
        value: digits,
        final: `${t('form.contact.whatsapp')}: ${dial} ${digits}`
    };
}

function getCurrentDiagnosisText() {
    const wrapper = $('#blueprint-result-wrapper');
    const output = $('#blueprint-output-text');
    if (!wrapper || wrapper.style.display === 'none' || !output?.innerText.trim()) return '';
    return output.innerText.trim();
}

function buildProposalText(payload) {
    const rows = [
        '==================================================',
        'PEDIDO DE PROPOSTA - EXODO TECH',
        '==================================================',
        `Nome:              ${payload.name}`,
        `Contacto:          ${payload.contact.final}`,
        `Metodo preferido:  ${payload.contact.label}`,
        `Tamanho da equipa: ${payload.team}`,
        `Area do negocio:   ${payload.niche}`,
        `Data/hora:         ${payload.requestedAtLocal}`,
        '',
        'Contexto do pedido:',
        `"${payload.problem}"`,
        '',
        '--------------------------------------------------',
        'Objetivo da conversa:',
        '  - Identificar onde tecnologia pode poupar tempo ou recuperar contactos.',
        '  - Avaliar se faz sentido comecar por website, atendimento automatico ou automacao interna.',
        '  - Definir uma proposta pratica e adequada ao negocio.'
    ];

    if (payload.diagnosis) {
        rows.push('', '--------------------------------------------------', 'Diagnostico gerado no site:', payload.diagnosis);
    }

    rows.push('', 'Pedido gerado pela SPA Exodo Tech.', '==================================================');
    return rows.join('\n');
}

async function postLead(payload, messageText) {
    const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, messageText })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'HTTP ' + response.status);
    return data;
}

function readLeadQueue() {
    try {
        const parsed = JSON.parse(localStorage.getItem(LEAD_QUEUE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function writeLeadQueue(queue) {
    try { localStorage.setItem(LEAD_QUEUE_KEY, JSON.stringify(queue.slice(-20))); } catch (e) {}
}

function queueLead(payload, messageText) {
    const queue = readLeadQueue();
    queue.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        attempts: 0,
        payload,
        messageText,
        queuedAt: new Date().toISOString()
    });
    writeLeadQueue(queue);
}

let retryInProgress = false;
let retryIntervalId = null;

async function retryQueuedLeads(showFeedback = false) {
    if (retryInProgress || !navigator.onLine) return;
    const queue = readLeadQueue();
    if (!queue.length) return;

    retryInProgress = true;
    const remaining = [];
    let sent = 0;

    for (const item of queue) {
        try {
            await postLead(item.payload, item.messageText);
            sent += 1;
        } catch (e) {
            remaining.push({ ...item, attempts: (item.attempts || 0) + 1, lastError: e.message });
        }
    }

    writeLeadQueue(remaining);
    retryInProgress = false;

    if (sent && showFeedback) {
        showAlert(t('form.retrySentTitle'), t('form.retrySentMsg'));
    }
}

async function buildStructuredProposal(event) {
    event.preventDefault();
    const form = $('#proposal-form');
    if (!form) return;

    updateContactFields();
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const teamSelect = $('#form-team');
    const contact = collectContactDetails();
    if (!contact.ok) {
        setFormStatus('error', contact.message);
        return;
    }

    const now = new Date();
    const payload = {
        name: $('#form-name').value.trim(),
        contact,
        team: teamSelect.options[teamSelect.selectedIndex].text,
        niche: $('#form-niche').value.trim(),
        problem: $('#form-bottleneck').value.trim(),
        diagnosis: getCurrentDiagnosisText(),
        language: CURRENT_LANG,
        requestedAt: now.toISOString(),
        requestedAtLocal: now.toLocaleString(CURRENT_LANG === 'pt' ? 'pt-PT' : CURRENT_LANG),
        source: 'exodo-tech-netlify-spa',
        page: location.href
    };

    const rawText = buildProposalText(payload);
    $('#proposal-raw-text').value = rawText;
    $('#summary-area').hidden = true;

    setProposalSending(true);
    setFormStatus('sending', t('form.sending'));

    try {
        await postLead(payload, rawText);
        setFormStatus('success', t('form.success'));
        $('#summary-area').hidden = false;
        form.reset();
        $('#proposal-raw-text').value = rawText;
        updateContactFields();
        retryQueuedLeads(false);
        runDiagnostics();
    } catch (error) {
        queueLead(payload, rawText);
        setFormStatus('error', t('form.queued'));
        $('#summary-area').hidden = false;
    } finally {
        setProposalSending(false);
    }
}

/* --- Global Blueprint engine -------------------------------- */
const NICHE_RULES = [
    {
        id: 'veterinary',
        title: 'Veterinário / Pet Care',
        terms: ['veterinario', 'veterinaria', 'vet', 'cachorro', 'cao', 'caes', 'gato', 'gatos', 'pet', 'pets', 'animal', 'animais', 'banho e tosa', 'tosquia', 'petshop', 'pet shop'],
        pain: 'pedidos por WhatsApp, marcações de consultas, vacinas, banhos/tosquias e dúvidas repetidas sobre horários ou urgências.',
        automation: 'receção digital que recolhe espécie, motivo do contacto, urgência, disponibilidade e encaminha para consulta, serviço ou lembrete automático.',
        expansion: 'menos chamadas perdidas, agenda mais preenchida e base de clientes pronta para campanhas de vacinação, check-ups e retorno.'
    },
    {
        id: 'beauty',
        title: 'Cabeleireiro / Estética',
        terms: ['cabelo', 'cabelos', 'cabeleireiro', 'cabeleireira', 'barbeiro', 'barbearia', 'salao', 'salon', 'unha', 'unhas', 'nail', 'estetica', 'beleza', 'spa', 'sobrancelha', 'depilacao', 'maquilhagem', 'maquiagem'],
        pain: 'marcações espalhadas por mensagens, no-shows, dúvidas sobre preços e pouca prova visual dos resultados.',
        automation: 'agenda por WhatsApp/site, lembretes automáticos, catálogo de serviços e recolha de fotos, preferências e avaliações.',
        expansion: 'mais reservas sem interrupções, maior retorno de clientes e apresentação premium para serviços de maior valor.'
    },
    {
        id: 'restaurant',
        title: 'Restauração / Bar / Café',
        terms: ['restaurante', 'restauracao', 'cafe', 'cafeteria', 'bar', 'pastelaria', 'pizzaria', 'sushi', 'hamburger', 'hamburguer', 'takeaway', 'delivery', 'comida', 'menu'],
        pain: 'reservas por telefone em horas de movimento, pedidos manuais, menus desatualizados e clientes sem follow-up.',
        automation: 'reservas, pedidos e confirmações via WhatsApp/site com menu digital, horários, lotação e campanhas automáticas.',
        expansion: 'menos erros, mais pedidos fora do telefone e uma base de clientes ativável em dias fracos ou eventos.'
    },
    {
        id: 'health',
        title: 'Clínica / Saúde',
        terms: ['clinica', 'consultorio', 'medico', 'medica', 'dentista', 'fisioterapia', 'fisio', 'psicologia', 'psicologo', 'saude', 'nutricionista', 'terapia', 'optica', 'oftalmologia'],
        pain: 'chamadas perdidas, confirmações manuais, faltas à consulta e dados iniciais recolhidos sem estrutura.',
        automation: 'triagem administrativa, marcações, lembretes, preparação de consulta e recolha segura de dados antes do contacto humano.',
        expansion: 'menos faltas, receção menos sobrecarregada e experiência mais organizada desde o primeiro pedido.'
    },
    {
        id: 'ecommerce',
        title: 'E-commerce / Loja Online',
        terms: ['ecommerce', 'e-commerce', 'loja online', 'shopify', 'woocommerce', 'produto', 'produtos', 'carrinho', 'encomenda', 'loja virtual', 'marketplace'],
        pain: 'carrinhos abandonados, dúvidas repetidas, seguimento manual de encomendas e pouca segmentação de clientes.',
        automation: 'recuperação de carrinhos, FAQs automáticas, tracking de pedidos e campanhas por interesse ou histórico de compra.',
        expansion: 'mais conversões com a mesma equipa e melhor retenção através de comunicação personalizada.'
    },
    {
        id: 'realestate',
        title: 'Imobiliária / Mediação',
        terms: ['imobiliaria', 'imovel', 'imoveis', 'real estate', 'mediação', 'mediacao', 'arrendamento', 'aluguer', 'apartamento', 'casa', 'propriedade', 'angariacao'],
        pain: 'muitos contactos curiosos, visitas mal qualificadas, perguntas repetidas e follow-up dependente da memória do consultor.',
        automation: 'qualificação por orçamento, zona, tipologia e prazo, com marcação de visitas e sequência automática de acompanhamento.',
        expansion: 'consultores focados em leads reais, visitas melhor preparadas e mais oportunidades recuperadas.'
    },
    {
        id: 'fitness',
        title: 'Ginásio / Fitness / Bem-estar',
        terms: ['ginasio', 'ginásio', 'fitness', 'personal trainer', 'pt', 'pilates', 'yoga', 'crossfit', 'treino', 'nutricao', 'bem estar'],
        pain: 'pedidos de horários, inscrições manuais, faltas a aulas e pouca recuperação de interessados.',
        automation: 'captação de leads, avaliação inicial, agendamento de aula experimental, lembretes e campanhas de retorno.',
        expansion: 'mais inscrições com follow-up consistente e menos tempo gasto em perguntas repetidas.'
    },
    {
        id: 'education',
        title: 'Escola / Formação',
        terms: ['escola', 'curso', 'formacao', 'formação', 'explicador', 'explicacao', 'aula', 'professor', 'academia', 'colegio', 'workshop', 'educacao'],
        pain: 'inscrições manuais, dúvidas sobre horários, comunicação dispersa e gestão de pagamentos em folhas.',
        automation: 'inscrição digital, confirmação automática, lembretes de aulas, envio de materiais e comunicação segmentada.',
        expansion: 'menos carga administrativa e experiência mais clara para alunos, famílias ou formandos.'
    },
    {
        id: 'services',
        title: 'Serviços Profissionais',
        terms: ['advogado', 'advocacia', 'contabilista', 'contabilidade', 'consultoria', 'consultor', 'arquitetura', 'engenharia', 'seguro', 'seguros', 'financeiro', 'servicos profissionais'],
        pain: 'pedidos sem contexto, triagem manual, propostas demoradas e follow-up irregular.',
        automation: 'formulário inteligente, qualificação do caso, organização documental e lembretes de resposta para proposta.',
        expansion: 'mais tempo para trabalho especializado e maior taxa de conversão em clientes adequados.'
    },
    {
        id: 'automotive',
        title: 'Automóvel / Oficina / Concessionária',
        terms: ['automovel', 'automoveis', 'carro', 'carros', 'oficina', 'mecanica', 'mecanico', 'concessionaria', 'stand', 'veiculo', 'veiculos', 'pneu', 'pneus', 'revisao', 'revisoes', 'garagem', 'retifica', 'funilaria', 'lavagem auto', 'detailing', 'auto pecas', 'motor', 'transmissao', 'motocicleta', 'moto', 'motos', 'scooter', 'camionete', 'utilitario'],
        pain: 'marcações manuais de revisões por WhatsApp, orçamentos sem resposta rápida, controlo de peças em stock e pouco seguimento de clientes após o serviço.',
        automation: 'agendamento automático de revisões com lembretes por WhatsApp, orçamentos digitais enviados em segundos e reativação automática de clientes para a próxima manutenção.',
        expansion: 'mais marcações sem depender de chamadas, clientes notificados atempadamente e base de dados ativa para campanhas de manutenção preventiva e recall.'
    },
    {
        id: 'tourism',
        title: 'Turismo / Hotelaria / Alojamento',
        terms: ['hotel', 'hostel', 'pousada', 'alojamento', 'turismo', 'viagem', 'viagens', 'airbnb', 'booking', 'reserva', 'reservas', 'quarto', 'quartos', 'suite', 'resort', 'agencia viagem', 'tour', 'excursao', 'cruzeiro', 'campismo', 'glamping', 'villa', 'apartamento turistico', 'guest house'],
        pain: 'reservas manuais por e-mail, dúvidas repetidas sobre disponibilidade, check-in descoordenado e recuperação quase nula de reservas abandonadas.',
        automation: 'motor de reservas automático com confirmação instantânea, check-in digital por WhatsApp, FAQs automatizadas e campanhas de recuperação de visitantes que não converteram.',
        expansion: 'taxa de ocupação mais alta, receção menos sobrecarregada e experiência premium desde o primeiro contacto que fideliza o hóspede.'
    },
    {
        id: 'construction',
        title: 'Construção / Remodelação / Obras',
        terms: ['construcao', 'construtor', 'empreiteiro', 'empreitada', 'obra', 'obras', 'remodelar', 'remodelacao', 'pedreiro', 'carpinteiro', 'eletricista', 'canalizacao', 'pintor', 'reformas', 'reforma', 'acabamento', 'estrutura', 'alvenaria', 'impermeabilizacao', 'telhado', 'calafetagem', 'serralheria', 'marcenaria', 'vidracaria'],
        pain: 'orçamentos demorados, coordenação de equipas por mensagens dispersas, clientes sem actualizações de progresso e propostas que ficam sem resposta.',
        automation: 'formulário de pedido de orçamento estruturado, qualificação automática do tipo de obra, envio de actualizações de progresso por WhatsApp e seguimento automático de propostas enviadas.',
        expansion: 'mais obras fechadas por proposta enviada, comunicação profissional que diferencia da concorrência e equipa de campo coordenada sem ruído.'
    },
    {
        id: 'logistics',
        title: 'Logística / Transportes / Distribuição',
        terms: ['logistica', 'transporte', 'transportes', 'camiao', 'camionista', 'distribuicao', 'entrega', 'entregas', 'frete', 'mudanca', 'mudancas', 'courier', 'expedicao', 'armazem', 'armazenamento', 'supply chain', 'frota', 'taxis', 'uber', 'motorista', 'motofrete', 'motoboy'],
        pain: 'coordenação manual de rotas por telefone, atualizações de entrega que dependem de chamadas, gestão de ocorrências sem sistema e faturação feita depois da entrega.',
        automation: 'notificações automáticas de estado de entrega, gestão de ocorrências via WhatsApp, faturação automática pós-entrega e rastreamento em tempo real para o cliente final.',
        expansion: 'menos chamadas de clientes a pedir ponto de situação, equipa focada na operação e eficiência medida por rota e por condutor.'
    },
    {
        id: 'events',
        title: 'Eventos / Casamentos / Entretenimento',
        terms: ['evento', 'eventos', 'casamento', 'casamentos', 'festa', 'festas', 'fotografo', 'fotografia', 'videomaker', 'dj', 'catering', 'buffet', 'animacao', 'animador', 'espetaculo', 'teatro', 'conferencia', 'congresso', 'seminario', 'workshop evento', 'exposicao', 'concerto', 'formatura'],
        pain: 'orçamentos por WhatsApp sem estrutura, confirmações de data por mensagem, datas sobrepostas sem sistema e portfólio difícil de mostrar ao cliente antes de fechar.',
        automation: 'formulário de briefing automático, proposta digital com confirmação de data, contrato digital com assinatura e lembretes automáticos nos dias-chave do evento.',
        expansion: 'mais eventos fechados por contacto recebido, processo profissional que justifica preços premium e portfólio digital que converte sem reunião presencial.'
    },
    {
        id: 'agriculture',
        title: 'Agricultura / Agronegócio / Pecuária',
        terms: ['agricultura', 'agronomia', 'agronegocio', 'fazenda', 'quinta', 'produtor', 'colheita', 'gado', 'pecuaria', 'horta', 'viveiro', 'cooperativa', 'vinho', 'adega', 'azeite', 'oliveira', 'leite', 'lacticinio', 'avicultura', 'suinocultura', 'piscicultura', 'aquicultura', 'mel', 'apicultura'],
        pain: 'comunicação com distribuidores por telefone, rastreabilidade manual de lotes, vendas directas sem sistema e sazonalidade mal aproveitada comercialmente.',
        automation: 'catálogo digital com pedidos automáticos de encomenda, rastreabilidade de lotes com QR code, notificações de colheita e campanhas para compradores na época certa.',
        expansion: 'mais vendas directas sem intermediário, gestão eficiente de stocks sazonais e presença digital que abre mercados internacionais à produção local.'
    },
    {
        id: 'cleaning',
        title: 'Limpeza / Serviços Domésticos / Manutenção',
        terms: ['limpeza', 'limpezas', 'empregada', 'faxina', 'higienizacao', 'dedetizacao', 'desinfecao', 'lavandaria', 'lavanderia', 'servicos domesticos', 'condominio', 'jardinagem', 'jardineiro', 'piscina manutencao', 'desentupimento', 'extintores', 'controlo pragas', 'ar condicionado manutencao'],
        pain: 'agendamentos confusos por mensagem, cancelamentos de última hora sem sistema alternativo e clientes recorrentes sem seguimento automático para renovação.',
        automation: 'agendamento automático com confirmação e lembrete no dia anterior, lista de serviço digital enviada ao cliente e reativação automática de clientes inativos há mais de 30 dias.',
        expansion: 'maior recorrência com a mesma equipa, menos falhas de comunicação e base de clientes fidelizados ativável em períodos de menor procura.'
    },
    {
        id: 'marketing',
        title: 'Marketing / Agência Digital / Comunicação',
        terms: ['marketing', 'agencia marketing', 'agencia digital', 'publicidade', 'social media', 'redes sociais', 'seo', 'google ads', 'meta ads', 'trafego pago', 'design grafico', 'branding', 'copywriting', 'producao conteudo', 'influencer', 'creator', 'relacoes publicas', 'assessoria imprensa'],
        pain: 'briefings recebidos sem estrutura mínima, aprovações de criativo por mensagem dispersa, relatórios mensais feitos à mão e clientes sem visibilidade clara do trabalho realizado.',
        automation: 'formulário de briefing digital por projeto, workflow de aprovação com notificações automáticas, relatórios de performance automáticos e portal de cliente com métricas em tempo real.',
        expansion: 'mais tempo para trabalho criativo de valor, menos reuniões de alinhamento e clientes que ficam mais tempo por verem resultados com clareza.'
    },
    {
        id: 'technology',
        title: 'Tecnologia / Software / SaaS / TI',
        terms: ['tecnologia', 'software', 'saas', 'startup', 'app', 'aplicativo', 'desenvolvimento', 'desenvolvedor', 'programador', 'ti', 'informatica', 'suporte tecnico', 'helpdesk', 'cloud', 'ciberseguranca', 'infraestrutura ti', 'erp', 'crm sistema', 'integracao sistemas', 'automacao ti'],
        pain: 'tickets de suporte sem triagem eficiente, onboarding manual de novos clientes, churn por falta de acompanhamento proativo e agendamento de demos dependente do comercial.',
        automation: 'triagem automática de tickets por prioridade, onboarding por sequência de mensagens e vídeos, alertas de churn com acção automática e agendamento autónomo de demos.',
        expansion: 'menor tempo médio de resolução, mais renovações e equipa de sucesso focada nos clientes certos no momento certo.'
    },
    {
        id: 'finance',
        title: 'Finanças / Crédito / Investimento',
        terms: ['banco', 'investimento', 'corretora', 'credito', 'emprestimo', 'financiamento', 'gestao patrimonial', 'planejamento financeiro', 'fundo', 'acoes', 'bolsa', 'forex', 'cripto', 'criptomoeda', 'cambio', 'leasing', 'factoring', 'seguros vida', 'previdencia', 'aposentadoria'],
        pain: 'leads sem qualificação de perfil de risco, documentação recolhida por e-mail disperso, follow-up manual e clientes existentes sem actualizações periódicas da carteira.',
        automation: 'formulário de perfil financeiro com triagem automática por capacidade e objetivo, pedido de documentos estruturado com prazo e lembretes automáticos de renovação de produtos.',
        expansion: 'conversão maior de leads qualificados, menos tempo em burocracia documental e carteira de clientes mais ativa e com menor taxa de abandono.'
    },
    {
        id: 'fashion',
        title: 'Moda / Vestuário / Acessórios',
        terms: ['moda', 'vestuario', 'roupa', 'roupas', 'boutique', 'atelier', 'costureira', 'costura', 'alfaiate', 'sapateiro', 'calcado', 'acessorio', 'bolsa', 'joalharia', 'bijuteria', 'relojoaria', 'outlet', 'multimarca', 'streetwear', 'sport fashion'],
        pain: 'pedidos de tamanho e disponibilidade por WhatsApp sem sistema, encomendas por medida sem acompanhamento e promoções enviadas manualmente para toda a base.',
        automation: 'catálogo digital interativo, gestão de encomendas por medida com actualizações automáticas, segmentação de clientes por preferência e campanhas de nova coleção.',
        expansion: 'mais recompras da base existente, menos trocas por erro de tamanho e comunicação de nova coleção que chega a quem realmente compra.'
    },
    {
        id: 'healthcare_advanced',
        title: 'Bem-estar / Estética Médica / Medicina Estética',
        terms: ['estetica medica', 'medicina estetica', 'botox', 'preenchimento', 'laser', 'depilacao laser', 'harmonizacao', 'microblading', 'implante capilar', 'clinica estetica', 'spa medicinal', 'massagista', 'quiropraxia', 'acupuntura', 'homeopatia', 'naturologia', 'terapeuta'],
        pain: 'agenda cheia de no-shows, consentimentos informados em papel, fotos antes/depois sem organização e pouca retenção após o primeiro procedimento.',
        automation: 'confirmação automática com formulário de consentimento digital, lembretes no dia anterior, galeria de resultados com captação de interesse e sequência de retorno.',
        expansion: 'menos no-shows, consentimentos sempre assinados antes da consulta e clientes que retornam para procedimentos complementares de forma automática.'
    }
];

const BUSINESS_HINTS = ['negocio', 'empresa', 'loja', 'servico', 'servicos', 'clinica', 'consultorio', 'restaurante', 'cafe', 'bar', 'imobiliaria', 'ecommerce', 'ginasio', 'fitness', 'estetica', 'advogado', 'contabilista', 'consultoria', 'agencia', 'marketing', 'escola', 'formacao', 'curso', 'oficina', 'hotel', 'turismo', 'atelier', 'studio', 'comercio', 'vendas', 'profissional', 'saude', 'medico', 'dentista', 'automovel', 'carro', 'mecanico', 'concessionaria', 'stand', 'veiculo', 'revisao', 'garagem', 'pneu', 'moto', 'reserva', 'hostel', 'pousada', 'alojamento', 'construcao', 'empreiteiro', 'obra', 'remodelacao', 'pedreiro', 'eletricista', 'logistica', 'transporte', 'entrega', 'frete', 'mudanca', 'courier', 'armazem', 'evento', 'casamento', 'festa', 'fotografo', 'catering', 'buffet', 'animacao', 'agricultura', 'fazenda', 'quinta', 'produtor', 'colheita', 'gado', 'viveiro', 'limpeza', 'faxina', 'lavandaria', 'jardinagem', 'condominio', 'publicidade', 'social media', 'branding', 'design', 'software', 'startup', 'app', 'aplicativo', 'desenvolvedor', 'suporte tecnico', 'credito', 'emprestimo', 'investimento', 'banco', 'corretora', 'moda', 'vestuario', 'roupa', 'boutique', 'costura', 'calcado', 'joalharia', 'botox', 'laser', 'harmonizacao', 'massagista', 'acupuntura', 'terapeuta'];

const BLOCKED_TERMS = ['teste', 'lol', 'haha', 'hehe', 'qwerty', 'asdf', 'abc123', 'minecraft', 'roblox', 'pokemon', 'netflix', 'meme', 'batman', 'superman', 'politica', 'casino', 'apostas', 'spam', 'scam', 'hack', 'hackear', 'fraude', 'droga', 'arma', 'bomba', 'matar', 'odio', 'racismo', 'xenofobia', 'porn', 'porno', 'sexo', 'caralho', 'merda', 'porra', 'puta', 'foda', 'fodase', 'idiota', 'burro'];

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s/-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function hasTerm(clean, tokens, term) {
    const normalized = normalizeText(term);
    if (!normalized) return false;
    return normalized.includes(' ') ? clean.includes(normalized) : tokens.includes(normalized);
}

function classifyNiche(input) {
    const clean = normalizeText(input);
    const tokens = clean.split(/\s+/).filter(Boolean);

    const invalidPattern =
        clean.length < 3 ||
        /^[0-9\s/+.-]+$/.test(clean) ||
        /(.)\1{4,}/.test(clean) ||
        (tokens.length === 1 && tokens[0].length > 5 && !/[aeiou]/.test(tokens[0]));

    if (invalidPattern) return { status: 'blocked', reason: 'invalid' };
    if (BLOCKED_TERMS.some(term => hasTerm(clean, tokens, term))) {
        return { status: 'blocked', reason: 'safety' };
    }

    const match = NICHE_RULES.find(rule => rule.terms.some(term => hasTerm(clean, tokens, term)));
    if (match) return { status: 'recognized', rule: match };

    const hasBusinessHint = BUSINESS_HINTS.some(term => hasTerm(clean, tokens, term));
    return hasBusinessHint ? { status: 'unknown' } : { status: 'blocked', reason: 'scope' };
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function supportMessageHtml() {
    return `
        <strong style="color:#fff;font-family:'Poppins',sans-serif;font-size:1rem;">Não foi possível gerar um Blueprint com segurança para esse texto.</strong>
        <div style="width:2.5rem;height:2px;background:linear-gradient(90deg,var(--cyan),var(--gold));border-radius:9999px;margin:.75rem 0 1.25rem;"></div>
        <p style="margin:0 0 1rem;color:#cbd5e1;">Este motor foi desenhado para identificar nichos e setores de negócio reais. Quando o texto parece ofensivo, inseguro ou fora do escopo, preferimos fazer uma análise humana.</p>
        <p style="margin:0;color:#94a3b8;">Por favor, entre em contato diretamente com o suporte: <a href="mailto:${SUPPORT_EMAIL}" style="color:var(--cyan);font-weight:800;">${SUPPORT_EMAIL}</a>.</p>`;
}

function buildRecognizedBlueprint(input, rule) {
    const safeInput = escapeHtml(input);
    return `
        <strong style="color:#fff;font-family:'Poppins',sans-serif;font-size:1rem;">Análise Estratégica — ${rule.title}</strong>
        <div style="width:2.5rem;height:2px;background:linear-gradient(90deg,var(--cyan),var(--gold));border-radius:9999px;margin:.75rem 0 1.25rem;"></div>
        <p style="margin:0 0 1rem;"><span style="color:var(--cyan);font-weight:700;">1. Identificação Semântica:</span> O termo <strong>${safeInput}</strong> foi classificado internamente como <strong>${rule.title}</strong>.</p>
        <p style="margin:0 0 1rem;"><span style="color:var(--gold);font-weight:700;">2. Barreiras Manuais Identificadas:</span> O gargalo mais provável está em ${rule.pain}</p>
        <p style="margin:0 0 1rem;"><span style="color:#22c55e;font-weight:700;">3. Blueprint Inicial:</span> Começar por ${rule.automation}</p>
        <p style="margin:0 0 1rem;"><span style="color:var(--cyan);font-weight:700;">4. Projeção de Expansão:</span> ${rule.expansion}</p>
        <p style="margin:1.25rem 0 0;padding-top:1rem;border-top:1px solid rgba(255,255,255,.06);font-size:.78rem;color:#94a3b8;"><i class="fa-solid fa-circle-info" style="color:var(--cyan);margin-right:.4rem;"></i>Próximo passo: use este Blueprint no pedido de contacto para recebermos o contexto certo desde o primeiro minuto.</p>`;
}

function buildGenericBlueprint(input) {
    const safeInput = escapeHtml(input);
    return `
        <strong style="color:#fff;font-family:'Poppins',sans-serif;font-size:1rem;">Análise Estratégica — ${safeInput}</strong>
        <div style="width:2.5rem;height:2px;background:linear-gradient(90deg,var(--cyan),var(--gold));border-radius:9999px;margin:.75rem 0 1.25rem;"></div>
        <p style="margin:0 0 1rem;"><span style="color:var(--cyan);font-weight:700;">1. Área Identificada:</span> <strong>${safeInput}</strong> parece ser um negócio real com potencial para presença web, captação de pedidos e automação operacional.</p>
        <p style="margin:0 0 1rem;"><span style="color:var(--gold);font-weight:700;">2. Entrada Recomendada:</span> Mapear primeiro onde chegam os contactos, quanto tempo demora a resposta e quais tarefas são repetidas pela equipa.</p>
        <p style="margin:0 0 1rem;"><span style="color:#22c55e;font-weight:700;">3. Blueprint Inicial:</span> Landing page de conversão, formulário inteligente e fluxo de seguimento por WhatsApp ou e-mail.</p>
        <p style="margin:1.25rem 0 0;padding-top:1rem;border-top:1px solid rgba(255,255,255,.06);font-size:.78rem;color:#94a3b8;">Descreva melhor esta área no formulário de contacto para a equipa preparar uma proposta ajustada.</p>`;
}

async function generateAiBlueprint() {
    const input = $('#blueprint-niche')?.value.trim() || '';
    if (!input) {
        showAlert(t('js.miss.title'), t('js.bp.req'));
        return;
    }

    const button = $('#btn-blueprint-generate');
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>' + t('js.bp.gen');
    }

    await new Promise(resolve => setTimeout(resolve, 420));

    const result = classifyNiche(input);
    const wrapper = $('#blueprint-result-wrapper');
    const output = $('#blueprint-output-text');
    if (wrapper) wrapper.style.display = 'block';

    if (result.status === 'blocked') {
        if (output) output.innerHTML = supportMessageHtml();
        showAlert(t('bp.supportTitle'), t('bp.supportMsg'));
    } else if (result.status === 'recognized') {
        if (output) output.innerHTML = buildRecognizedBlueprint(input, result.rule);
        const formNiche = $('#form-niche');
        if (formNiche) formNiche.value = input;
        runDiagnostics();
        showAlert(t('js.bp.done.title'), t('js.bp.done.msg'));
    } else {
        if (output) output.innerHTML = buildGenericBlueprint(input);
        const formNiche = $('#form-niche');
        if (formNiche) formNiche.value = input;
        runDiagnostics();
        showAlert(t('js.bp.done.title'), t('js.bp.done.msg'));
    }

    if (button) {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-file-invoice-dollar mr-2"></i>' + t('bp.btn');
    }
    wrapper?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* --- Utilities ---------------------------------------------- */
async function copyText(text, successMessage) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (e) {
        const temp = document.createElement('textarea');
        temp.value = text;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
    }
    showAlert(t('alerts.copiedTitle'), successMessage || t('alerts.proposalCopied'));
}

function initContactForm() {
    populateCountryCodes('PT');
    detectVisitorCountry();

    $('#form-country-code')?.addEventListener('change', () => { countryTouched = true; });
    $$('input[name="contact-method"]').forEach(input => input.addEventListener('change', updateContactFields));
    $('#proposal-form')?.addEventListener('submit', buildStructuredProposal);
    $('#copy-proposal')?.addEventListener('click', () => copyText($('#proposal-raw-text')?.value || '', t('alerts.proposalCopied')));
    updateContactFields();

    window.addEventListener('online', () => retryQueuedLeads(true));
    setTimeout(() => retryQueuedLeads(false), 1200);
    retryIntervalId = setInterval(() => retryQueuedLeads(false), 30000);
}

function boot() {
    applyLanguage(CURRENT_LANG);
    initContactForm();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}

/* --- Scroll reveal ------------------------------------------ */
const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.10, rootMargin: '0px 0px -35px 0px' });

$$('.reveal').forEach(element => revealObs.observe(element));
