require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    EmbedBuilder
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const cadastros = new Map();

client.once(Events.ClientReady, () => {
    console.log(`Bot conectado: ${client.user.tag}`);
});

function criarMenusEtapa1(userId) {
    const pistao = new StringSelectMenuBuilder()
        .setCustomId(`pistao_${userId}`)
        .setPlaceholder('Selecione o pistão')
        .addOptions(
            { label: 'Original', value: 'Original' },
            { label: 'Forjado Taxado', value: 'Forjado Taxado' },
            { label: 'Forjado Reto', value: 'Forjado Reto' },
            { label: 'Forjado Destaxado', value: 'Forjado Destaxado' }
        );

    const comando = new StringSelectMenuBuilder()
        .setCustomId(`comando_${userId}`)
        .setPlaceholder('Selecione o comando')
        .addOptions(
            { label: 'Original', value: 'Original' },
            { label: 'De Baixa', value: 'De Baixa' },
            { label: 'Médio', value: 'Médio' },
            { label: 'Graduado', value: 'Graduado' }
        );

    const cabecote = new StringSelectMenuBuilder()
        .setCustomId(`cabecote_${userId}`)
        .setPlaceholder('Selecione o cabeçote')
        .addOptions(
            { label: 'Original', value: 'Original' },
            { label: 'Duto Polido', value: 'Duto Polido' },
            { label: 'Duto Arrombado', value: 'Duto Arrombado' }
        );

    const intake = new StringSelectMenuBuilder()
        .setCustomId(`intake_${userId}`)
        .setPlaceholder('Intake?')
        .addOptions(
            { label: 'Sim', value: 'Sim' },
            { label: 'Não', value: 'Não' }
        );

    const proxima = new ButtonBuilder()
        .setCustomId(`proxima_${userId}`)
        .setLabel('Próxima Etapa')
        .setStyle(ButtonStyle.Primary);

    return [
        new ActionRowBuilder().addComponents(pistao),
        new ActionRowBuilder().addComponents(comando),
        new ActionRowBuilder().addComponents(cabecote),
        new ActionRowBuilder().addComponents(intake),
        new ActionRowBuilder().addComponents(proxima)
    ];
}

function criarMenusEtapa2(userId) {
    const downpipe = new StringSelectMenuBuilder()
        .setCustomId(`downpipe_${userId}`)
        .setPlaceholder('Downpipe?')
        .addOptions(
            { label: 'Sim', value: 'Sim' },
            { label: 'Não', value: 'Não' }
        );

    const booster = new StringSelectMenuBuilder()
        .setCustomId(`booster_${userId}`)
        .setPlaceholder('Booster?')
        .addOptions(
            { label: 'Sim', value: 'Sim' },
            { label: 'Não', value: 'Não' }
        );

    const finalizar = new ButtonBuilder()
        .setCustomId(`finalizar_${userId}`)
        .setLabel('Finalizar Cadastro')
        .setStyle(ButtonStyle.Success);

    return [
        new ActionRowBuilder().addComponents(downpipe),
        new ActionRowBuilder().addComponents(booster),
        new ActionRowBuilder().addComponents(finalizar)
    ];
}

async function enviarFicha(interaction, dados) {
    const canal = await client.channels.fetch(process.env.DATABASE_CHANNEL_ID);

    const embed = new EmbedBuilder()
        .setTitle(`🚗 ${dados.veiculo}`)
        .setDescription('Ficha de limite/acerto cadastrada')
        .addFields(
            { name: '🔩 Pistão', value: dados.pistao || 'Não informado', inline: true },
            { name: '⚙️ Comando', value: dados.comando || 'Não informado', inline: true },
            { name: '🔧 Cabeçote', value: dados.cabecote || 'Não informado', inline: true },
            { name: '🌬️ Intake', value: dados.intake || 'Não informado', inline: true },
            { name: '🔥 Downpipe', value: dados.downpipe || 'Não informado', inline: true },
            { name: '🌀 Pressão Turbina', value: `${dados.pressaoTurbina} KG`, inline: true },
            { name: '🚀 Booster', value: dados.booster || 'Não informado', inline: true },
            { name: '📈 Pressão Booster', value: dados.pressaoBooster ? `${dados.pressaoBooster} KG` : 'Não possui', inline: true }
        )
        .setFooter({ text: `Cadastrado por ${interaction.user.tag}` })
        .setTimestamp();

    await canal.send({ embeds: [embed] });
    cadastros.delete(interaction.user.id);
}

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'painel') {
            const botao = new ButtonBuilder()
                .setCustomId('cadastrar_acerto')
                .setLabel('Cadastrar Acerto')
                .setStyle(ButtonStyle.Primary);

            await interaction.reply({
                content: 'Clique no botão abaixo para cadastrar um acerto.',
                components: [new ActionRowBuilder().addComponents(botao)]
            });
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'cadastrar_acerto') {
            const modal = new ModalBuilder()
                .setCustomId('modal_inicio')
                .setTitle('Cadastrar Acerto');

            const veiculo = new TextInputBuilder()
                .setCustomId('veiculo')
                .setLabel('Nome do veículo')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const pressaoTurbina = new TextInputBuilder()
                .setCustomId('pressao_turbina')
                .setLabel('Pressão da turbina em KG')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 1.8')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(veiculo),
                new ActionRowBuilder().addComponents(pressaoTurbina)
            );

            await interaction.showModal(modal);
        }

        if (interaction.customId.startsWith('proxima_')) {
            const userId = interaction.customId.split('_')[1];

            if (interaction.user.id !== userId) {
                return interaction.reply({
                    content: 'Esse cadastro pertence a outro usuário.',
                    ephemeral: true
                });
            }

            const dados = cadastros.get(userId);

            if (!dados) {
                return interaction.reply({
                    content: 'Cadastro não encontrado. Comece novamente.',
                    ephemeral: true
                });
            }

            const obrigatoriosEtapa1 = ['pistao', 'comando', 'cabecote', 'intake'];
            const faltando = obrigatoriosEtapa1.filter(campo => !dados[campo]);

            if (faltando.length > 0) {
                return interaction.reply({
                    content: `Faltam campos: ${faltando.join(', ')}`,
                    ephemeral: true
                });
            }

            return interaction.update({
                content: 'Etapa 2: selecione Downpipe e Booster. Depois finalize.',
                components: criarMenusEtapa2(userId)
            });
        }

        if (interaction.customId.startsWith('finalizar_')) {
            const userId = interaction.customId.split('_')[1];
            const dados = cadastros.get(userId);

            if (!dados) {
                return interaction.reply({
                    content: 'Cadastro não encontrado. Comece novamente.',
                    ephemeral: true
                });
            }

            const camposObrigatorios = ['pistao', 'comando', 'cabecote', 'intake', 'downpipe', 'booster'];
            const faltando = camposObrigatorios.filter(campo => !dados[campo]);

            if (faltando.length > 0) {
                return interaction.reply({
                    content: `Faltam campos: ${faltando.join(', ')}`,
                    ephemeral: true
                });
            }

            if (dados.booster === 'Sim') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_booster')
                    .setTitle('Pressão do Booster');

                const pressaoBooster = new TextInputBuilder()
                    .setCustomId('pressao_booster')
                    .setLabel('Pressão do booster em KG')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 2.2')
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(pressaoBooster)
                );

                return interaction.showModal(modal);
            }

            await enviarFicha(interaction, dados);

            return interaction.reply({
                content: '✅ Ficha cadastrada com sucesso!',
                ephemeral: true
            });
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_inicio') {
            const userId = interaction.user.id;

            cadastros.set(userId, {
                veiculo: interaction.fields.getTextInputValue('veiculo'),
                pressaoTurbina: interaction.fields.getTextInputValue('pressao_turbina')
            });

            return interaction.reply({
                content: 'Etapa 1: selecione Pistão, Comando, Cabeçote e Intake.',
                components: criarMenusEtapa1(userId),
                ephemeral: true
            });
        }

        if (interaction.customId === 'modal_booster') {
            const userId = interaction.user.id;
            const dados = cadastros.get(userId);

            if (!dados) {
                return interaction.reply({
                    content: 'Cadastro não encontrado. Comece novamente.',
                    ephemeral: true
                });
            }

            dados.pressaoBooster = interaction.fields.getTextInputValue('pressao_booster');

            await enviarFicha(interaction, dados);

            return interaction.reply({
                content: '✅ Ficha cadastrada com sucesso!',
                ephemeral: true
            });
        }
    }

    if (interaction.isStringSelectMenu()) {
        const [campo, userId] = interaction.customId.split('_');

        if (interaction.user.id !== userId) {
            return interaction.reply({
                content: 'Esse cadastro pertence a outro usuário.',
                ephemeral: true
            });
        }

        const dados = cadastros.get(userId);

        if (!dados) {
            return interaction.reply({
                content: 'Cadastro não encontrado. Comece novamente.',
                ephemeral: true
            });
        }

        dados[campo] = interaction.values[0];
        cadastros.set(userId, dados);

        return interaction.reply({
            content: `✅ ${campo} selecionado: ${interaction.values[0]}`,
            ephemeral: true
        });
    }
});

client.login(process.env.TOKEN);