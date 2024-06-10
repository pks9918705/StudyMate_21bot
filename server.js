const {Telegraf} =require('telegraf')

require('dotenv').config()

const bot=new Telegraf(process.env.TELEGRAM_BOT_API);

// console.log('api',process.env.TELEGRAM_BOT_API);



bot.start(async (ctx) => {
    // console.log('ctx',ctx);
    const from=ctx.update.message.from;
    console.log('user',from);
    // getting the user details who have send the command
    
    
    
    await ctx.reply("welcome to telegram coding ");
    
    
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM')) 