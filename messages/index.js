const { BotFrameworkAdapter, MessageFactory } = require('botbuilder');
const axios = require('axios');

// Bot configuration
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// n8n webhook URLs for each profile
const WEBHOOKS = {
    megamind: 'https://workflows.saxtechnology.com/webhook/megamind-chat',
    cpa: 'https://workflows.saxtechnology.com/webhook/megamind-cpa',
    trainer: 'https://workflows.saxtechnology.com/webhook/megamind-trainer',
    auditor: 'https://workflows.saxtechnology.com/webhook/megamind-auditor',
    tech: 'https://workflows.saxtechnology.com/webhook/megamind-tech'
};

// Store conversation states in memory (use Azure Storage in production)
const conversationStates = new Map();

// Error handling for adapter
adapter.onTurnError = async (context, error) => {
    console.error('Bot error:', error);
    await context.sendActivity('Sorry, something went wrong!');
};

module.exports = async function (context, req) {
    context.log('Received request:', req.method, req.url);
    
    // Handle Bot Framework messages
    await adapter.processActivity(req, context.res, async (turnContext) => {
        if (turnContext.activity.type === 'message') {
            const conversationId = turnContext.activity.conversation.id;
            const userId = turnContext.activity.from.id;
            const userMessage = turnContext.activity.text || '';

            // Get current profile (default to megamind)
            let currentProfile = conversationStates.get(conversationId) || 'megamind';

            // Handle profile switching commands
            const lowerMessage = userMessage.toLowerCase().trim();
            if (lowerMessage.startsWith('/')) {
                const command = lowerMessage.substring(1);
                
                if (command === 'help') {
                    await turnContext.sendActivity(MessageFactory.text(
                        '🤖 **Available Commands:**\n\n' +
                        '• /switch - Switch AI profile\n' +
                        '• /profile - Show current profile\n' +
                        '• /megamind - General Business Assistant\n' +
                        '• /cpa - Tax & Accounting Expert\n' +
                        '• /trainer - Learning & Development\n' +
                        '• /auditor - Audit & Compliance\n' +
                        '• /tech - IT Assistant'
                    ));
                    return;
                }
                
                if (command === 'profile') {
                    const profileNames = {
                        megamind: '🧠 General Business Assistant',
                        cpa: '📋 Tax & Accounting Expert',
                        trainer: '📚 Learning & Development',
                        auditor: '🔍 Audit & Compliance',
                        tech: '💻 IT Assistant'
                    };
                    await turnContext.sendActivity(MessageFactory.text(
                        `Current profile: ${profileNames[currentProfile] || currentProfile}`
                    ));
                    return;
                }
                
                if (command === 'switch') {
                    await turnContext.sendActivity(MessageFactory.text(
                        '**Switch Profile:**\n\n' +
                        '• /megamind - 🧠 General Business Assistant\n' +
                        '• /cpa - 📋 Tax & Accounting Expert\n' +
                        '• /trainer - 📚 Learning & Development\n' +
                        '• /auditor - 🔍 Audit & Compliance\n' +
                        '• /tech - 💻 IT Assistant'
                    ));
                    return;
                }
                
                // Profile switch commands
                if (['megamind', 'cpa', 'trainer', 'auditor', 'tech'].includes(command)) {
                    currentProfile = command;
                    conversationStates.set(conversationId, currentProfile);
                    
                    const profileNames = {
                        megamind: '🧠 General Business Assistant',
                        cpa: '📋 Tax & Accounting Expert',
                        trainer: '📚 Learning & Development',
                        auditor: '🔍 Audit & Compliance',
                        tech: '💻 IT Assistant'
                    };
                    
                    await turnContext.sendActivity(MessageFactory.text(
                        `✅ Switched to: ${profileNames[command]}`
                    ));
                    return;
                }
            }

            try {
                // Send typing indicator
                await turnContext.sendActivities([{ type: 'typing' }]);

                // Forward to n8n webhook
                const webhookUrl = WEBHOOKS[currentProfile];
                const response = await axios.post(webhookUrl, {
                    message: userMessage,
                    conversationId: conversationId,
                    userId: userId,
                    profile: currentProfile,
                    timestamp: new Date().toISOString()
                }, {
                    timeout: 25000 // 25 second timeout
                });

                // Send n8n response back to user
                const botResponse = response.data.response || response.data.message || 'I received your message.';
                await turnContext.sendActivity(MessageFactory.text(botResponse));

            } catch (error) {
                console.error('Error forwarding to n8n:', error.message);
                await turnContext.sendActivity(MessageFactory.text(
                    '❌ Sorry, I encountered an error processing your request. Please try again.'
                ));
            }
        }
        else if (turnContext.activity.type === 'conversationUpdate') {
            // Welcome message for new conversations
            if (turnContext.activity.membersAdded) {
                for (const member of turnContext.activity.membersAdded) {
                    if (member.id !== turnContext.activity.recipient.id) {
                        await turnContext.sendActivity(MessageFactory.text(
                            '👋 Welcome to **SAXTech MegaMind AI**!\n\n' +
                            'I\'m your intelligent business assistant with specialized expertise profiles.\n\n' +
                            'Type /help to see available commands.'
                        ));
                    }
                }
            }
        }
    });
};
