export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { email } = data;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ message: "Invalid email address" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = import.meta.env.BREVO_API_KEY;
    const listId = Number(import.meta.env.BREVO_LIST_ID) || 2;

    if (!apiKey) {
      console.error("BREVO_API_KEY is not set");
      return new Response(JSON.stringify({ message: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true, // Update if exists
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API Error:", errorData);
      
      // Handle "Contact already exists" (though updateEnabled should handle it, explicit errors might still occur)
      if (errorData.code === "duplicate_parameter") {
           return new Response(JSON.stringify({ message: "Contact already exists" }), {
            status: 409, // Conflict
            headers: { "Content-Type": "application/json" },
          });
      }

      return new Response(JSON.stringify({ message: "Failed to subscribe" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Successfully subscribed" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Newsletter API Error:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
