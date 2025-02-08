import OpenAI from 'openai';
import readlineSync from 'readline-sync';

const OPENAI_API_KEY = "your_api_key";

const client = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

// TOOLS
function getWeatherDetails(city = '') {
    if (city.toLowerCase() === 'patiala') return '10°C';
    if (city.toLowerCase() === 'mohali') return '14°C';
    if (city.toLowerCase() === 'bangalore') return '18°C';
    if (city.toLowerCase() === 'chandigarh') return '8°C';
    if (city.toLowerCase() === 'delhi') return '11°C';
}

const tools = {
    getWeatherDetails: getWeatherDetails
};

const SYSTEM_PROMPT = `You are an AI Assistant with START, PLAN, ACTION, Observation and Output State. Wait for the user prompt and first PLAN using available tools. After Planning, Take the action with appropriate tools and wait for Observation based on Action. Once you get the observations, Return the AI response based on START prompt and observations.

Strictly follow the JSON format as in the example.

Available Tools:
- function getWeatherDetails(city: string): string
{ "type": "plan", "plan": "I will call getWeatherDetails for Mohali" }
{ "type": "action", "function": "getWeatherDetails", "input": "mohali" }
{ "type": "observation", "observation": "14°C" }
{ "type": "output", "output": "The sum of weather of Patiala and Mohali is 24°C" }`;

const message = [
    {
        role: 'system',
        content: SYSTEM_PROMPT
    }
];

async function chat() {
    while (true) {
        const query = readlineSync.question('>>');
        const q = {
            type: 'user',
            user: query,
        };
        message.push({"role": "user", "content": JSON.stringify(q)});

        while (true) {
            const chat = await client.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: message,
                response_format: {
                    "type": "json_object"
                }
            });

            const result = chat.choices[0].message.content;
            message.push({"role": "assistant", "content": result});

            const call = JSON.parse(result);
            if (call.type === 'output') {
                console.log(`🤖: ${call.output}`);
                break;
            } else if (call.type === 'action') {
                const fn = tools[call.function];
                const observation = fn(call.input);
                const obs = {
                    "type": "observation", "observation": observation
                };
                message.push({
                    role: "developer", content: JSON.stringify(obs)
                });
            }
        }
    }
}

chat();