import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyCTp5xzeyTDiqpy_LCEgKilS9HcY6BwDVk");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
model.generateContent("Test prompt").then(res => console.log(res.response.text())).catch(e => console.error(e.message));
