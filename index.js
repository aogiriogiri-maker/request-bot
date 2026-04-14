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
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

const TOKEN = process.env.TOKEN;

const CHANNEL_ID = '1493650682782285864';
const LOG_CHANNEL_ID = '1470242269696233596';
const RECRUITER_ROLE = '1493716953028624424';

// роли доступа в заявку
const ROLES = [
    '1493716953028624424',
];

const ROLE_ACCEPT = '1493658902385131531';

const acceptedStats = {};

// ---------- ПАНЕЛЬ ----------
client.once('ready', async () => {
    console.log('Бот запущен');

    const channel = await client.channels.fetch(CHANNEL_ID);

    const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setDescription(`👋 **Путь в семью Kamatoz начинается здесь!**`);

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

    if (interaction.customId === 'form') {

        await interaction.deferReply({ ephemeral: true });

        try {
            const newChannel = await interaction.guild.channels.create({
                name: `заявка-${interaction.user.username}`,
                type: ChannelType.GuildText,

                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ['ViewChannel'],
                    },
                    {
                        id: interaction.user.id,
                        allow: ['ViewChannel', 'SendMessages'],
                    },
                    ...ROLES.map(roleId => ({
                        id: roleId,
                        allow: ['ViewChannel', 'SendMessages']
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

            const rolesPing = ROLES.map(id => `<@&${id}>`).join(' ');

            await newChannel.send({
                content: `<@&${RECRUITER_ROLE}>\n${rolesPing}\n<@${interaction.user.id}>`,
                embeds: [embed],
                components: [row]
            });

            await interaction.editReply('✅ Заявка отправлена!');
        } catch (err) {
            console.error(err);
            await interaction.editReply(`❌ Ошибка: ${err.message}`);
        }
    }
});

// ---------- ПРИНЯТЬ / ОТКЛОНИТЬ ----------
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    const member = interaction.member;

    // 🚫 только рекрут
    if (!member.roles.cache.has(RECRUITER_ROLE)) {
        return interaction.reply({
            content: '❌ У тебя нет доступа',
            ephemeral: true
        });
    }

    // 🚫 нельзя принять свою
    const userId = interaction.customId.split('_')[1];
    if (interaction.user.id === userId) {
        return interaction.reply({
            content: '❌ Нельзя принять свою заявку',
            ephemeral: true
        });
    }

    // ПРИНЯТЬ
    if (interaction.customId.startsWith('accept_')) {

        const target = await interaction.guild.members.fetch(userId);
        await target.roles.add(ROLE_ACCEPT);

        if (!acceptedStats[interaction.user.id]) {
            acceptedStats[interaction.user.id] = 0;
        }
        acceptedStats[interaction.user.id]++;

        const logChannel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID);

        await logChannel.send({
            content: `✅ Принят\n👤 <@${userId}>\n🛠 <@${interaction.user.id}>\n📊 Всего: ${acceptedStats[interaction.user.id]}`
        });

        await interaction.reply('✅ Принят');
    }

    // ОТКЛОН
    if (interaction.customId.startsWith('deny_')) {

        const logChannel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID);

        await logChannel.send({
            content: `❌ Отклонён\n👤 <@${userId}>\n🛠 <@${interaction.user.id}>`
        });

        await interaction.reply('❌ Отклонён');
    }
});

client.login(TOKEN);
