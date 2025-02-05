import { Context, Schema, Session } from 'koishi'

export const name = 'chemistry-exam'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

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

// 用户答题状态接口
interface UserState {
    currentQuestion: ChemicalFormula
    correctCount: number
    startTime: number
    totalQuestions: number
}

export function apply(ctx: Context) {
    // 使用 Map 存储用户状态
    const userStates = new Map<string, UserState>()

    // 注册刷题命令
    ctx.command('刷化学')
        .alias('chemistry')
        .action(({ session }) => {
            const key = getSessionKey(session)

            // 检查是否已在答题
            if (userStates.has(key)) {
                return '您已经在答题中，请输入答案或发送“退出”结束当前练习。'
            }

            // 初始化题目
            const question = getRandomFormula()
            userStates.set(key, {
                currentQuestion: question,
                correctCount: 0,
                startTime: Date.now(),
                totalQuestions: 1,
            })

            return `题目 #1：请计算 ${question.formula} 的相对分子质量（输入数字或“退出”）`
        })

    // 中间件处理用户输入
    ctx.middleware(async (session, next) => {
        const key = getSessionKey(session)
        const state = userStates.get(key)
        if (!state) return next()

        const input = session.content.trim()

        // 处理退出指令
        if (input === '退出') {
            const result = generateResultMessage(state, true)
            userStates.delete(key)
            return result
        }

        // 验证数字输入
        const answer = parseFloat(input)
        if (isNaN(answer)) {
            return '请输入有效的数字或发送“退出”结束练习'
        }

        // 验证答案（允许±0.01的误差）
        const isCorrect = Math.abs(answer - state.currentQuestion.mass) < 0.01
        state.totalQuestions++

        // 回答正确
        if (isCorrect) {
            state.correctCount++
            const nextQuestion = getRandomFormula()
            state.currentQuestion = nextQuestion

            return [
                `✅ 正确！当前连续正确：${state.correctCount}`,
                `题目 #${state.totalQuestions}：请计算 ${nextQuestion.formula} 的相对分子质量`,
            ].join('\n')
        }

        // 回答错误
        const result = generateResultMessage(state, false)
        userStates.delete(key)
        return result
    })

    // 获取会话唯一标识
    function getSessionKey(session: Session) {
        return `${session.userId}:${session.channelId}`
    }

    // 随机获取化学式
    function getRandomFormula(): ChemicalFormula {
        return FORMULAS[Math.floor(Math.random() * FORMULAS.length)]
    }

    // 生成结果消息
    function generateResultMessage(state: UserState, isManualExit: boolean) {
        const timeUsed = Date.now() - state.startTime
        const accuracy = (state.correctCount / (state.totalQuestions - 1)) * 100

        return [
            isManualExit ? '🛑 已主动结束练习' : '❌ 回答错误，练习结束',
            `├ 累计答题：${state.totalQuestions - 1} 道`,
            `├ 正确数量：${state.correctCount} 道`,
            `├ 正确率：${accuracy.toFixed(1)}%`,
            `└ 用时：${formatTime(timeUsed)}`,
        ].join('\n')
    }

    // 格式化时间
    function formatTime(ms: number) {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}分${remainingSeconds.toString().padStart(2, '0')}秒`
    }
}