require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, () => {
    console.log(`Bot conectado: ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'painel') {

            const botao = new ButtonBuilder()
                .setCustomId('cadastrar_acerto')
                .setLabel('Cadastrar Acerto')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
                .addComponents(botao);

            await interaction.reply({
                content: 'Clique no botão para cadastrar um acerto.',
                components: [row]
            });
        }
    }

    if (interaction.isButton()) {

        if (interaction.customId === 'cadastrar_acerto') {

            await interaction.reply({
                content: 'Botão funcionando! Próxima etapa será abrir o formulário.',
                ephemeral: true
            });
        }
    }
});

client.login(process.env.TOKEN);