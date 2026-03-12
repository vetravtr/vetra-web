import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
    const API_URL = "https://my.ftassetmanagement.com/api/bcl.asp?KeyCodeGUID=91f9ff32-be3c-11f0-8d07-00155d010b18&AccountGUID=d2e45a89-7de0-11f0-8b61-00155d010b18&AccountNr=42528";
    
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
};
