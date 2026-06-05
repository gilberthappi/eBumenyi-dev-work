/**
 * Cross-domain cookie setter
 * Sets cookies that can be read by both www.ebumenyi.online and meeting.ebumenyi.online
 */

export const setCookieForAllDomains = (tokenValue: string) => {
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const expiryDate = new Date(Date.now() + sevenDaysMs).toUTCString();

  // Set cookie with root domain (.ebumenyi.online) - works for all subdomains
  document.cookie = `accessToken=${tokenValue}; domain=.ebumenyi.online; path=/; expires=${expiryDate}; SameSite=Lax; Secure`;
  
  // Also set without domain for current domain
  document.cookie = `accessToken=${tokenValue}; path=/; expires=${expiryDate}; SameSite=Lax; Secure`;
  
  console.log('✅ Cookies set for both .ebumenyi.online and current domain');
};

export const clearCookiesFromAllDomains = () => {
  // Clear with root domain (use max-age=0 and match Secure flag)
  document.cookie = 'accessToken=; domain=.ebumenyi.online; path=/; max-age=0; SameSite=Lax; Secure';
  
  // Clear current domain
  document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax; Secure';
  
  // Also try without Secure flag (for development)
  document.cookie = 'accessToken=; domain=.ebumenyi.online; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
  
  // Clear any other related cookies
  document.cookie = '_auth=; domain=.ebumenyi.online; path=/; max-age=0; SameSite=Lax; Secure';
  document.cookie = '_auth=; path=/; max-age=0; SameSite=Lax; Secure';
  document.cookie = '_auth=; domain=.ebumenyi.online; path=/; max-age=0; SameSite=Lax';
  document.cookie = '_auth=; path=/; max-age=0; SameSite=Lax';
  
  console.log('✅ Cookies cleared from both domains');
};
