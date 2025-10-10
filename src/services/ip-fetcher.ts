export async function getPublicIP(endpoint: string): Promise<string> {
  const res = await fetch(endpoint);
  return res.text();
}
