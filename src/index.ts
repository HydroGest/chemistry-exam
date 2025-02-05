import { Context, Schema, Session } from 'koishi'

export const name = 'chemistry-exam'

// 定义化学式类型
interface ChemicalFormula {
    formula: string
    mass: number
}

// 预定义的化学式列表（示例数据）
const FORMULAS: ChemicalFormula[] = [
    { formula: "H₂O", mass: 18 },       // 水
    { formula: "CO₂", mass: 44 },       // 二氧化碳
    { formula: "CH₄", mass: 16 },       // 甲烷
    { formula: "NH₃", mass: 17 },       // 氨气
    { formula: "O₂", mass: 32 },        // 氧气
    { formula: "NaCl", mass: 58 },      // 氯化钠
    { formula: "C₁₂H₂₂O₁₁", mass: 342 }, // 蔗糖
    { formula: "H₂SO₄", mass: 98 },     // 硫酸
    { formula: "Fe₃O₄", mass: 232 },    // 四氧化三铁
    { formula: "CuO", mass: 80 },       // 氧化铜
    { formula: "Cu₂O", mass: 144 },     // 氧化亚铜

    { formula: "HCl", mass: 36 },       // 盐酸
    { formula: "HNO₃", mass: 63 },      // 硝酸
    { formula: "NaOH", mass: 40 },      // 氢氧化钠
    { formula: "CaCO₃", mass: 100 },    // 碳酸钙
    { formula: "H₂O₂", mass: 34 },      // 过氧化氢
    { formula: "C₆H₁₂O₆", mass: 180 },  // 葡萄糖
    { formula: "C₂H₄O₂", mass: 60 },    // 乙酸
    { formula: "CaO", mass: 56 },       // 氧化钙
    { formula: "MgO", mass: 40 },       // 氧化镁
    { formula: "Al₂O₃", mass: 102 },    // 氧化铝
    { formula: "SO₂", mass: 64 },       // 二氧化硫
    { formula: "SO₃", mass: 80 },       // 三氧化硫
    { formula: "NO₂", mass: 46 },       // 二氧化氮
    { formula: "N₂O", mass: 44 },       // 一氧化二氮
    { formula: "KCl", mass: 74 },       // 氯化钾
    { formula: "H₂S", mass: 34 },       // 硫化氢
    { formula: "CH₃OH", mass: 32 },     // 甲醇
    { formula: "C₂H₅OH", mass: 46 },    // 乙醇
    { formula: "H₃PO₄", mass: 98 },     // 磷酸
    { formula: "Ca(OH)₂", mass: 74 },   // 氢氧化钙
    { formula: "BaSO₄", mass: 233 },    // 硫酸钡
    { formula: "Pb(NO₃)₂", mass: 331 }, // 硝酸铅
    { formula: "NH₄NO₃", mass: 80 },    // 硝酸铵
    { formula: "Mg(OH)₂", mass: 58 },   // 氢氧化镁
    { formula: "Al(OH)₃", mass: 78 },   // 氢氧化铝
    { formula: "FeS₂", mass: 120 },     // 二硫化亚铁
    { formula: "C₃H₈", mass: 44 },      // 丙烷
    { formula: "C₄H₁₀", mass: 58 },     // 丁烷
    { formula: "HCN", mass: 27 },       // 氰化氢
];

export interface Config {
    timeout?: number
    precision?: number
}

export const Config: Schema<Config> = Schema.object({
    timeout: Schema.number().default(300000).description('回答超时时间（毫秒）'),
    precision: Schema.number().default(0.01).description('允许的误差范围')
})

export function apply(ctx: Context, config: Config) {
    ctx.command('刷化学')
        .alias('chemistry')
        .action(async ({ session }) => {
            // 状态变量
            let correctCount = 0
            let totalQuestions = 0
            const startTime = Date.now()

            try {
                while (true) {
                    const question = FORMULAS[Math.floor(Math.random() * FORMULAS.length)]
                    totalQuestions++

                    // 发送题目并等待回答
                    await session.send(`题目 #${totalQuestions}：请计算 ${question.formula} 的相对分子质量\n（输入数字或“退出”）`);
                    const answer = await session.prompt(config.timeout);

                    // 处理超时
                    if (answer === '超时') {
                        await session.send('⏰ 回答超时，练习自动结束')
                        break
                    }

                    // 处理退出指令
                    if (answer === '退出') {
                        await session.send('🛑 已主动结束练习')
                        break
                    }

                    // 验证数字输入
                    const parsed = parseFloat(answer)
                    if (isNaN(parsed)) {
                        await session.send('⚠️ 请输入有效数字或发送“退出”')
                        totalQuestions-- // 不统计无效输入
                        continue
                    }

                    // 验证答案
                    if (Math.abs(parsed - question.mass) < config.precision) {
                        correctCount++
                        await session.send(`✅ 正确！连续正确次数：${correctCount}`)
                    } else {
                        await session.send(`❌ 错误！正确答案是 ${question.mass}`)
                        break
                    }
                }
            } finally {
                // 生成统计信息
                const duration = Date.now() - startTime
                const accuracy = totalQuestions > 0
                    ? (correctCount / totalQuestions * 100).toFixed(1)
                    : '0.0'

                await session.send([
                    '📊 练习统计',
                    `├ 总题数：${totalQuestions}`,
                    `├ 正确数：${correctCount}`,
                    `├ 正确率：${accuracy}%`,
                    `└ 用时：${formatTime(duration)}`
                ].join('\n'))
            }
        })
}

// 格式化时间显示
function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}分${seconds.toString().padStart(2, '0')}秒`
}