'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import OpenAI from 'openai'
import { revalidatePath } from 'next/cache'
import { validateImageFile } from '@/lib/upload'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure this is in your .env
});

export async function scanBusinessCard(formData: FormData) {
    const userId = await getAuthUserId();
    if (!userId) {
        return { success: false as const, message: "Your session has expired. Sign in again to scan a card." };
    }

    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
        return { success: false as const, message: "No image was received. Please choose a photo of the card and try again." };
    }

    // Same 5MB ceiling and MIME allowlist as every other image upload. The
    // base64 encoding below inflates the payload ~33%, so this also keeps the
    // request under the Server Action body limit.
    const validated = validateImageFile(file);
    if (!validated.ok) {
        return { success: false as const, message: validated.message };
    }

    if (!process.env.OPENAI_API_KEY) {
        console.error('[scanBusinessCard] OPENAI_API_KEY is not set');
        return { success: false as const, message: "Card scanning is not configured on this server. Please enter the details manually." };
    }

    // 1. Convert File to Base64 for OpenAI
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Image}`;

    try {
        // 2. Ask AI to extract data
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // or "gpt-4o-mini" for cheaper cost
            messages: [
                {
                    role: "system",
                    content: `You are a data extraction assistant. 
                    Extract the following fields from the business card image: Name, Email, Company, Website, JobTitle, Phone. 
                    Return ONLY raw JSON. Do not include markdown formatting (like \`\`\`json). 
                    If a field is missing, set it to null.`
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Extract data from this card." },
                        { type: "image_url", image_url: { url: dataUrl } },
                    ],
                },
            ],
            max_tokens: 300,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            return { success: false as const, message: "The card could not be read from that image. Try a sharper, well-lit photo." };
        }

        // Clean up markdown if AI adds it accidentally
        const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

        let data: unknown;
        try {
            data = JSON.parse(cleanedContent);
        } catch (error) {
            console.error('[scanBusinessCard] model returned non-JSON content', { cleanedContent, error });
            return { success: false as const, message: "We could not interpret the details on that card. Please enter them manually." };
        }

        return { success: true as const, data };

    } catch (error) {
        console.error("[scanBusinessCard]", error);
        return { success: false as const, message: "The card scanning service is unavailable right now. Please try again shortly or enter the details manually." };
    }
}

export async function saveContact(data: any) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    await prisma.contact.create({
        data: {
            userId,
            name: data.name || "Unknown",
            email: data.email,
            company: data.company,
            website: data.website,
            phone: data.phone,
            jobTitle: data.jobTitle,
            notes: data.notes
        }
    });

    revalidatePath('/dashboard/contacts');
    return { success: true };
}