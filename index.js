require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, Events } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, () => console.log(`✅ ${client.user.tag} Online!`));

// أمر إرسال زر التقديم
client.on(Events.MessageCreate, async message => {
    if (message.content === '!setup' && message.member.permissions.has('Administrator')) {
        const embed = new EmbedBuilder()
            .setTitle('🌟 انضم لطاقمنا')
            .setDescription('اضغط على الزر بالأسفل لتقديم طلبك')
            .setColor('#2f3136');

        const btn = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('apply_btn').setLabel('تقديم').setStyle(ButtonStyle.Success)
        );

        message.channel.send({ embeds: [embed], components: [btn] });
    }
});

// التعامل مع التفاعلات
client.on(Events.InteractionCreate, async interaction => {
    // فتح المودال
    if (interaction.isButton() && interaction.customId === 'apply_btn') {
        const modal = new ModalBuilder().setCustomId('apply_modal').setTitle('نموذج التقديم');
        const nameInput = new TextInputBuilder().setCustomId('name').setLabel("الاسم والعمر").setStyle(TextInputStyle.Short).setRequired(true);
        const whyInput = new TextInputBuilder().setCustomId('why').setLabel("لماذا تريد الانضمام؟").setStyle(TextInputStyle.Paragraph).setRequired(true);
        
        modal.addComponents(new ActionRowBuilder().addComponents(nameInput), new ActionRowBuilder().addComponents(whyInput));
        return interaction.showModal(modal);
    }

    // إرسال الطلب للإدارة
    if (interaction.isModalSubmit() && interaction.customId === 'apply_modal') {
        const name = interaction.fields.getTextInputValue('name');
        const why = interaction.fields.getTextInputValue('why');

        const adminEmbed = new EmbedBuilder()
            .setTitle('📩 طلب جديد')
            .addFields({ name: 'المقدم', value: `<@${interaction.user.id}>` }, { name: 'الاسم', value: name }, { name: 'السبب', value: why })
            .setColor('Blue');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`accept_${interaction.user.id}`).setLabel('قبول').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`reject_${interaction.user.id}`).setLabel('رفض').setStyle(ButtonStyle.Danger)
        );

        const logChannel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
        await logChannel.send({ embeds: [adminEmbed], components: [row] });
        await interaction.reply({ content: '✅ تم إرسال طلبك!', ephemeral: true });
    }

    // أزرار القبول والرفض
    if (interaction.isButton() && (interaction.customId.startsWith('accept_') || interaction.customId.startsWith('reject_'))) {
        const [action, userId] = interaction.customId.split('_');
        const targetUser = await client.users.fetch(userId);
        
        if (action === 'accept') {
            await targetUser.send('🎉 مبروك! تم قبولك في الطاقم.').catch(() => {});
            await interaction.reply({ content: `تم قبول <@${userId}>` });
        } else {
            await targetUser.send('❌ للأسف، تم رفض طلبك. حاول لاحقاً.').catch(() => {});
            await interaction.reply({ content: `تم رفض <@${userId}>` });
        }
        await interaction.message.delete();
    }
});

client.login(process.env.TOKEN);
