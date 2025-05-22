async function recognize(base64, lang, options) {
    const { config, utils } = options;
    const { tauriFetch: fetch } = utils;
    let { model = "gemini-2.0-flash", apiKey, requestPath, customPrompt } = config;

    if (!requestPath) {
        requestPath = "https://generativelanguage.googleapis.com";
    }

    if (!/https?:\/\/.+/.test(requestPath)) {
        requestPath = `https://${requestPath}`;
    }

    if (requestPath.endsWith('/')) {
        requestPath = requestPath.slice(0, -1);
    }

    if (!requestPath.includes('/v1beta/models')) {
        requestPath += `/v1beta/models/${model}:generateContent`;
    }

    requestPath += `?key=${apiKey}`;

    if (!customPrompt) {
        customPrompt = "Act like a text scanner. Extract text as it is without analyzing it and without summarizing it. Treat all images as a whole document and analyze them accordingly. Think of it as a document with multiple pages, each image being a page. Understand page-to-page flow logically and semantically.";
    } else {
        customPrompt = customPrompt.replaceAll("$lang", lang);
    }

    const headers = {
        'Content-Type': 'application/json'
    }

    const body = {
        contents: [
            {
                role: "user",
                parts: [
                    {
                        inline_data: {
                            mime_type: "image/png",
                            data: base64
                        }
                    },
                    {
                        text: customPrompt
                    }
                ]
            }
        ],
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_NONE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
            }
        ]
    };

    let res = await fetch(requestPath, {
        method: 'POST',
        url: requestPath,
        headers: headers,
        body: {
            type: "Json",
            payload: body
        }
    });

    if (res.ok) {
        let result = res.data;
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "No text found";
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}
