const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Events,
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = '1493650682782285864';
const CLIENT_ID = '1493652408432066660';

// регистрация команды
const commands = [
    new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Панель заявок Kamatoz')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log('Команды зарегистрированы');
    } catch (error) {
        console.error(error);
    }
})();

// панель
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'panel') {

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('Kamatoz Family')
            .setImage('ССЫЛКА_НА_ЛОГО')
            .setDescription(`
👋 Путь в семью начинается здесь!

📌 Заполни заявку ниже
⏱ Рассмотрение: 1-2 дня
            `);

        const button = new ButtonBuilder()
            .setCustomId('apply')
            .setLabel('Подать заявку')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
});

// форма
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'apply') {

        const modal = new ModalBuilder()
            .setCustomId('application_modal')
            .setTitle('Заявка Kamatoz');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('name')
                    .setLabel('Имя')
                    .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('age')
                    .setLabel('Возраст')
                    .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('nick')
                    .setLabel('Игровой ник')
                    .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('history')
                    .setLabel('История семей')
                    .setStyle(TextInputStyle.Paragraph)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('video')
                    .setLabel('Видео (ганг/капты)')
                    .setStyle(TextInputStyle.Paragraph)
            )
        );

        await interaction.showModal(modal);
    }
});

// отправка
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'application_modal') {

        const embed = new EmbedBuilder()
            .setTitle('📥 Новая заявка Kamatoz')
            .addFields(
                { name: 'Имя', value: interaction.fields.getTextInputValue('name') },
                { name: 'Возраст', value: interaction.fields.getTextInputValue('age') },
                { name: 'Ник', value: interaction.fields.getTextInputValue('nick') },
                { name: 'История', value: interaction.fields.getTextInputValue('history') },
                { name: 'Видео', value: interaction.fields.getTextInputValue('video') }
            );

        const channel = await client.channels.fetch(CHANNEL_ID);
        await channel.send({ embeds: [embed] });

        await interaction.reply({
            content: '✅ Заявка отправлена!',
            ephemeral: true
        });
    }
});

client.login(TOKEN);
