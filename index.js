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

const CHANNEL_ID = '1493632481763790954';

const ROLES = [
    '1493715429963731075',
    '1245159189777485885',
    '1252665952160452760',
];

const ROLE_ACCEPT = '1245316820903395349';
const RECRUIT_ROLE = '1493715429963731075';
const LOG_CHANNEL_ID = '1493716294531416085';

const stats = {};

// ---------- ПАНЕЛЬ ----------
client.once('ready', async () => {
    console.log('Бот запущен');

    const channel = await client.channels.fetch(CHANNEL_ID);

    const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setImage('https://i.imgur.com/JkO2Vvi.png')
        .setDescription(`
👋 Путь в семью Kamatoz начинается здесь!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Важно
Прочитайте ВСЕ ВОПРОСЫ.
Если не ответили — ЗАЯВКА ОТКЛОНЯЕТСЯ.
ЗАЯВКИ только на сервер Orlando (18)
**Требования**
Возраст - 15+
Иметь среднюю стрельбу с тяжки и сайги
Быть адекватным

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📥 Нажми кнопку ниже
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

// ---------- ОБРАБОТЧИК ----------
client.on(Events.InteractionCreate, async interaction => {

    // ---------- КНОПКА ----------
    if (interaction.isButton() && interaction.customId === 'apply') {

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
                new TextInputBuilder().setCustomId('nick').setLabel('Игровой ник').setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('history').setLabel('История семей и почему ушел').setStyle(TextInputStyle.Paragraph)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('video').setLabel('Откаты с гг спеш+сайга').setStyle(TextInputStyle.Paragraph)
            )
        );

        return interaction.showModal(modal);
    }

    // ---------- СОЗДАНИЕ ЗАЯВКИ ----------
    if (interaction.isModalSubmit() && interaction.customId === 'form') {
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

            const call = new ButtonBuilder()
                .setCustomId(`call_${interaction.user.id}`)
                .setLabel('Вызвать на обзвон')
                .setStyle(ButtonStyle.Secondary);

            const take = new ButtonBuilder()
                .setCustomId(`take_${interaction.user.id}`)
                .setLabel('Взять заявку')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(accept, deny, call, take);

            await newChannel.send({
                content: `<@&${RECRUIT_ROLE}> <@${interaction.user.id}>`,
                embeds: [embed],
                components: [row]
            });

            return interaction.reply({
                content: '✅ Заявка отправлена!',
                ephemeral: true
            });

        } catch (err) {
            console.error(err);
            return interaction.reply({
                content: '❌ Ошибка при создании заявки',
                ephemeral: true
            });
        }
    }

    // ---------- КНОПКИ ----------
    if (interaction.isButton()) {

        const userId = interaction.customId.split('_')[1];

        // ❌ нельзя свою заявку
        if (interaction.user.id === userId) {
            return interaction.reply({
                content: '❌ Нельзя свою заявку',
                ephemeral: true
            });
        }

        // ✅ ПРИНЯТЬ
        if (interaction.customId.startsWith('accept_')) {

            const member = await interaction.guild.members.fetch(userId);
            await member.roles.add(ROLE_ACCEPT);

            stats[interaction.user.id] = (stats[interaction.user.id] || 0) + 1;

            const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

            await logChannel.send(
                `✅ <@${interaction.user.id}> принял <@${userId}> | Всего: ${stats[interaction.user.id]}`
            );

            await interaction.reply('✅ Принят');

            // автоудаление
            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 10000);
        }

        // ❌ ОТКЛОНИТЬ
        if (interaction.customId.startsWith('deny_')) {

            const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

            await logChannel.send(
                `❌ <@${interaction.user.id}> отклонил <@${userId}>`
            );

            await interaction.reply('❌ Отклонён');

            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 10000);
        }

        // 📞 ОБЗВОН
        if (interaction.customId.startsWith('call_')) {

            await interaction.channel.send(
                `📞 <@${userId}> Вас вызвали на обзвон, зайдите в любой войс`
            );

            return interaction.reply({
                content: '📞 Вызов отправлен',
                ephemeral: true
            });
        }

        // 🧾 ВЗЯТЬ ЗАЯВКУ
        if (interaction.customId.startsWith('take_')) {

            if (!interaction.member.roles.cache.has(RECRUIT_ROLE)) {
                return interaction.reply({
                    content: '❌ Только для рекрутов',
                    ephemeral: true
                });
            }

            await interaction.channel.send(
                `🧾 <@${interaction.user.id}> взял заявку`
            );

            return interaction.reply({
                content: '✅ Ты взял заявку',
                ephemeral: true
            });
        }
    }
});

client.login(TOKEN);
