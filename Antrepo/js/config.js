// config.js - Dinamik baseUrl ve auth bilgilerini içerir
export const getBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Localhost üzerinde mi çalışıyor?
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3002'; // Lokal geliştirme
  } 
  
  // Render veya başka bir host üzerinde mi?
  return window.location.origin; // Canlı ortam için aynı domain
};

// Base URL tanımı
export const baseUrl = getBaseUrl();

// Basic Auth bilgileri (Render ortamı için gerekli)
export const basicAuthCredentials = {
  username: 'selcukunalscr@gmail.com', // veya selcukunalscr@gmail.com
  password: 'Ayahuasca2019'      // veya Ayahuasca2019
};

// Tüm fetch API çağrıları için kullanılacak yardımcı fonksiyon
export const fetchWithAuth = async (url, options = {}) => {
  // Varsayılan options
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Basic Auth header'ı ekle
  const authString = `${basicAuthCredentials.username}:${basicAuthCredentials.password}`;
  const base64Auth = btoa(authString);
  
  // Mevcut headers ile birleştir
  const headers = {
    ...defaultOptions.headers,
    'Authorization': `Basic ${base64Auth}`,
    ...(options.headers || {})
  };
  
  // Tüm options'ları birleştir
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers
  };
  
  // Fetch isteği yap
  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};

console.log('API istekleri için kullanılan URL:', baseUrl);
