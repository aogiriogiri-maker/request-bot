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

const CHANNEL_ID = '1493650682782285864';

// роли (кто видит заявки)
const ROLES = [
    '1493658504538624111',
    '1493658601347223762',
    '1493658647958392912',
    '1493658676148306072'
];

// роль при принятии
const ROLE_ACCEPT = '1493658902385131531';

// роль рекрут (кого тегать)
const RECRUIT_ROLE = 'ВСТАВЬ_ID_РЕКРУТА';

// лог канал
const LOG_CHANNEL_ID = 'ВСТАВЬ_ID_ЛОГ_КАНАЛА';

// счетчик
const stats = {};

// ---------- ПАНЕЛЬ ----------
client.once('ready', async () => {
    console.log('Бот запущен');

    const channel = await client.channels.fetch(CHANNEL_ID);

        const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setDescription(`👋 **Путь в семью Kamatoz начинается здесь!**
        
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
         📌 Важно
        Прочитайте ВСЕ ВОПРОСЫ.
        Если не ответили — ЗАЯВКА ОТКЛОНЯЕТСЯ.
        ЗАЯВКИ В СЕМЬЮ ПРИНИМАЮТСЯ ТОЛЬКО НА СЕРВЕР Orlando (18)
        • Исключительно 15+
        • Минимальная длина откатов с GG — от 5 минут.
        • Адекватность
        • Прайм тайм 4+ часа
            
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
        📥 Подача заявки
        Нажми кнопку ниже
        
        
        
        `);

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
                new TextInputBuilder().setCustomId('name').setLabel('Имя').setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('age').setLabel('Возраст').setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('nick').setLabel('Ник').setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('history').setLabel('История').setStyle(TextInputStyle.Paragraph)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('video').setLabel('Видео').setStyle(TextInputStyle.Paragraph)
            )
        );

        await interaction.showModal(modal);
    }
});

// ---------- ОТПРАВКА ----------
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== 'form') return;

    try {
        const panelChannel = await client.channels.fetch(CHANNEL_ID);
        const category = panelChannel.parent;

        const newChannel = await interaction.guild.channels.create({
            name: `заявка-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: category.id,

            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: ['ViewChannel'],
                },
                {
                    id: interaction.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                },
                ...ROLES.map(roleId => ({
                    id: roleId,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                }))
            ]
        });

        const embed = new EmbedBuilder()
            .setTitle('📥 Новая заявка')
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

        await newChannel.send({
            content: `<@&${RECRUIT_ROLE}> <@${interaction.user.id}>`,
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: '✅ Заявка отправлена!',
            ephemeral: true
        });

    } catch (err) {
        console.error(err);
        await interaction.reply({
            content: '❌ Ошибка при создании заявки',
            ephemeral: true
        });
    }
});

// ---------- ПРИНЯТЬ / ОТКЛОНИТЬ ----------
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('accept_')) {
        const userId = interaction.customId.split('_')[1];

        // нельзя принять свою заявку
        if (interaction.user.id === userId) {
            return interaction.reply({
                content: '❌ Нельзя принять свою заявку',
                ephemeral: true
            });
        }

        const member = await interaction.guild.members.fetch(userId);
        await member.roles.add(ROLE_ACCEPT);

        // статистика
        stats[interaction.user.id] = (stats[interaction.user.id] || 0) + 1;

        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

        await logChannel.send(
            `✅ <@${interaction.user.id}> принял <@${userId}> | Всего: ${stats[interaction.user.id]}`
        );

        await interaction.reply('✅ Принят');
    }

    if (interaction.customId.startsWith('deny_')) {
        const userId = interaction.customId.split('_')[1];

        if (interaction.user.id === userId) {
            return interaction.reply({
                content: '❌ Нельзя отклонить свою заявку',
                ephemeral: true
            });
        }

        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

        await logChannel.send(
            `❌ <@${interaction.user.id}> отклонил <@${userId}>`
        );

        await interaction.reply('❌ Отклонён');
    }
});

client.login(TOKEN);
