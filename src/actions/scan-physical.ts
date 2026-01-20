'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth'
import OpenAI from 'openai'
import { revalidatePath } from 'next/cache'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure this is in your .env
});

export async function scanBusinessCard(formData: FormData) {
    const userId = await getAuthUserId();
    if (!userId) throw new Error("Unauthorized");

    const file = formData.get('file') as File;
    if (!file) throw new Error("No file uploaded");

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

        const content = response.choices[0].message.content;
        if (!content) throw new Error("AI could not read image");

        // Clean up markdown if AI adds it accidentally
        const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanedContent);

        return { success: true, data };

    } catch (error) {
        console.error("Scan Error:", error);
        return { success: false, message: "Failed to scan card." };
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