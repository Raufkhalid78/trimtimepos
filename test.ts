import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const apiKey = "AIzaSyCTp5xzeyTDiqpy_LCEgKilS9HcY6BwDVk"
const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

try {
    const result = await model.generateContent("Test prompt")
    console.log(await result.response.text())
} catch (e) {
    console.error(e.message)
}
