async function fetchAndPut(url: string, url2: string) {
    const response = await fetch(url);
    const body = response.body;
    if (!body) {
        return;
    }

    await fetch(url2, {
        method: "PUT",
        body: body,
        headers: {
            "Content-Type": response.headers.get("Content-Type") || "",
        },
    });
}

async function main() {}
