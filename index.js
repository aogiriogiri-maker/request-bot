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
    Events
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = '1493650682782285864';

// команда /panel
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Панель заявок Kamatoz')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands('1493652408432066660'),
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
👋 **Путь в семью начинается здесь!**

📌 **Важно**
Если не ответил на все вопросы — заявка отклоняется

⏱ Рассмотрение: 1–2 дня

📜 Правила:
• Откаты не более 1 недели
• Набор должен быть открыт
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

// кнопка
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'apply') {

        const modal = new ModalBuilder()
            .setCustomId('application_modal')
            .setTitle('Заявка Kamatoz');

        const name = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('Ник')
            .setStyle(TextInputStyle.Short);

        const age = new TextInputBuilder()
            .setCustomId('age')
            .setLabel('Возраст')
            .setStyle(TextInputStyle.Short);

        const exp = new TextInputBuilder()
            .setCustomId('exp')
            .setLabel('Опыт')
            .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(
            new ActionRowBuilder().addComponents(name),
            new ActionRowBuilder().addComponents(age),
            new ActionRowBuilder().addComponents(exp)
        );

        await interaction.showModal(modal);
    }
});

// отправка заявки
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.customId === 'application_modal') {

    const embed = new EmbedBuilder()
        .setTitle('Новая заявка Kamatoz')
        .addFields(
            { name: 'Имя', value: interaction.fields.getTextInputValue('name') },
            { name: 'Возраст', value: interaction.fields.getTextInputValue('age') },
            { name: 'Ник', value: interaction.fields.getTextInputValue('nick') },
            { name: 'История семей', value: interaction.fields.getTextInputValue('history') },
            { name: 'Видео ганга', value: interaction.fields.getTextInputValue('gang') }
        );

    const channel = await client.channels.fetch(CHANNEL_ID);
    await channel.send({ embeds: [embed] });

    await interaction.reply({
        content: '✅ Заявка отправлена!',
        ephemeral: true
    });
}

client.login(TOKEN);
