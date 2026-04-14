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
    ChannelType
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const TOKEN = process.env.TOKEN;

// 👉 ВСТАВЬ
const CHANNEL_ID = '1493650682782285864';

// роли (вставь ID ролей)
const ROLES = [
    '1493658504538624111',
    '1493658601347223762',
    '1493658647958392912',
    '1493658676148306072'
];

const ROLE_ACCEPT = 'ID_ПЫЛЬ';

// ---------- ПАНЕЛЬ АВТО ----------
client.once('ready', async () => {
    console.log('Бот запущен');

    const channel = await client.channels.fetch(CHANNEL_ID);

    const embed = new EmbedBuilder()
        .setTitle('📥 Заявка в Kamatoz')
        .setDescription('Нажми кнопку ниже и подай заявку');

    const button = new ButtonBuilder()
        .setCustomId('apply')
        .setLabel('Подать заявку')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await channel.send({
        embeds: [embed],
        components: [row]
    });
});

// ---------- КНОПКА ----------
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'apply') {

        const modal = new ModalBuilder()
            .setCustomId('form')
            .setTitle('Заявка');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('name').setLabel('Имя').setStyle(1)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('age').setLabel('Возраст').setStyle(1)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('nick').setLabel('Ник').setStyle(1)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('history').setLabel('История').setStyle(2)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('video').setLabel('Видео').setStyle(2)
            )
        );

        await interaction.showModal(modal);
    }
});

// ---------- ОТПРАВКА ----------
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'form') {

        const channel = await client.channels.fetch(CHANNEL_ID);

        const thread = await channel.threads.create({
            name: `Заявка ${interaction.user.username}`,
            autoArchiveDuration: 1440,
            type: ChannelType.PublicThread
        });

        // добавляем роли
        for (let roleId of ROLES) {
            const role = interaction.guild.roles.cache.get(roleId);
            if (role) {
                await thread.members.add(roleId).catch(() => {});
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Новая заявка')
            .addFields(
                { name: 'Имя', value: interaction.fields.getTextInputValue('name') },
                { name: 'Возраст', value: interaction.fields.getTextInputValue('age') },
                { name: 'Ник', value: interaction.fields.getTextInputValue('nick') },
                { name: 'История', value: interaction.fields.getTextInputValue('history') },
                { name: 'Видео', value: interaction.fields.getTextInputValue('video') }
            );

        const accept = new ButtonBuilder()
            .setCustomId(`accept_${interaction.user.id}`)
            .setLabel('Принять')
            .setStyle(ButtonStyle.Success);

        const deny = new ButtonBuilder()
            .setCustomId(`deny_${interaction.user.id}`)
            .setLabel('Отклонить')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(accept, deny);

        await thread.send({
            content: `<@${interaction.user.id}>`,
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: '✅ Заявка отправлена!',
            ephemeral: true
        });
    }
});

// ---------- ПРИНЯТЬ / ОТКЛОНИТЬ ----------
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('accept_')) {
        const userId = interaction.customId.split('_')[1];
        const member = await interaction.guild.members.fetch(userId);

        await member.roles.add(ROLE_ACCEPT);

        await interaction.reply('✅ Принят');
    }

    if (interaction.customId.startsWith('deny_')) {
        await interaction.reply('❌ Отклонён');
    }
});

client.login(TOKEN);
