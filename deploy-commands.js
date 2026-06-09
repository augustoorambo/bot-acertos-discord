require('dotenv').config();

const { REST, Routes } = require('discord.js');

const commands = [
    {
        name: 'painel',
        description: 'Abre o painel de cadastro de acertos'
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log('Comando registrado!');
    } catch (error) {
        console.error(error);
    }
})();