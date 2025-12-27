import React, { useState, useCallback, useEffect } from 'react';

// MBTI 四个维度
type Dimension = 'EI' | 'SN' | 'TF' | 'JP';

interface Question {
    id: number;
    text: string;
    dimension: Dimension;
    optionA: { text: string; type: string };
    optionB: { text: string; type: string };
}

interface Answer {
    questionId: number;
    selectedType: string;
}

interface PersonalityType {
    type: string;
    name: string;
    title: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
    careers: string[];
    celebrities: string[];
    color: string;
}

// 32道MBTI测试问题
const QUESTIONS: Question[] = [
    // E/I 维度 (8题)
    { id: 1, text: '在社交聚会中，你通常会：', dimension: 'EI', optionA: { text: '主动与很多人交谈，包括陌生人', type: 'E' }, optionB: { text: '只和认识的几个人深入交流', type: 'I' } },
    { id: 2, text: '当你需要充电恢复精力时，你更倾向于：', dimension: 'EI', optionA: { text: '和朋友出去玩或参加活动', type: 'E' }, optionB: { text: '独处或安静地待着', type: 'I' } },
    { id: 3, text: '在团队讨论中，你通常：', dimension: 'EI', optionA: { text: '先说出想法再思考', type: 'E' }, optionB: { text: '先思考再发言', type: 'I' } },
    { id: 4, text: '你更喜欢的工作环境是：', dimension: 'EI', optionA: { text: '开放式办公，经常与同事互动', type: 'E' }, optionB: { text: '安静独立的空间，减少干扰', type: 'I' } },
    { id: 5, text: '周末时你更愿意：', dimension: 'EI', optionA: { text: '参加派对或社交活动', type: 'E' }, optionB: { text: '在家看书、看电影或独自活动', type: 'I' } },
    { id: 6, text: '认识新朋友时，你觉得：', dimension: 'EI', optionA: { text: '很容易，喜欢认识新面孔', type: 'E' }, optionB: { text: '需要时间，更喜欢深交几个人', type: 'I' } },
    { id: 7, text: '在表达观点时，你更倾向于：', dimension: 'EI', optionA: { text: '边说边想，通过交流理清思路', type: 'E' }, optionB: { text: '先想清楚再说，确保表达准确', type: 'I' } },
    { id: 8, text: '长时间独处后，你会感到：', dimension: 'EI', optionA: { text: '渴望社交，想和人交流', type: 'E' }, optionB: { text: '很充实，享受独处时光', type: 'I' } },

    // S/N 维度 (8题)
    { id: 9, text: '你更关注的是：', dimension: 'SN', optionA: { text: '现在发生的具体事实', type: 'S' }, optionB: { text: '未来的可能性和潜力', type: 'N' } },
    { id: 10, text: '阅读一本书时，你更喜欢：', dimension: 'SN', optionA: { text: '实用类、操作指南类书籍', type: 'S' }, optionB: { text: '充满想象力的小说或理论书籍', type: 'N' } },
    { id: 11, text: '学习新技能时，你倾向于：', dimension: 'SN', optionA: { text: '按照步骤一步步来', type: 'S' }, optionB: { text: '先了解整体概念再学细节', type: 'N' } },
    { id: 12, text: '你更信任：', dimension: 'SN', optionA: { text: '亲身经历和实际经验', type: 'S' }, optionB: { text: '直觉和第六感', type: 'N' } },
    { id: 13, text: '描述一件事时，你通常会：', dimension: 'SN', optionA: { text: '注重细节和准确的事实', type: 'S' }, optionB: { text: '使用比喻和联想', type: 'N' } },
    { id: 14, text: '面对问题时，你更倾向于：', dimension: 'SN', optionA: { text: '使用已被证明有效的方法', type: 'S' }, optionB: { text: '尝试新的创新方案', type: 'N' } },
    { id: 15, text: '你认为自己是：', dimension: 'SN', optionA: { text: '现实主义者，脚踏实地', type: 'S' }, optionB: { text: '理想主义者，追求愿景', type: 'N' } },
    { id: 16, text: '在对话中，你更喜欢讨论：', dimension: 'SN', optionA: { text: '具体的事情和实际话题', type: 'S' }, optionB: { text: '抽象的概念和理论', type: 'N' } },

    // T/F 维度 (8题)
    { id: 17, text: '做决定时，你更看重：', dimension: 'TF', optionA: { text: '逻辑分析和客观事实', type: 'T' }, optionB: { text: '个人价值观和他人感受', type: 'F' } },
    { id: 18, text: '当朋友遇到问题向你倾诉时，你会：', dimension: 'TF', optionA: { text: '帮助分析问题并提供解决方案', type: 'T' }, optionB: { text: '先表示理解和共情', type: 'F' } },
    { id: 19, text: '你认为更重要的是：', dimension: 'TF', optionA: { text: '公正公平，一视同仁', type: 'T' }, optionB: { text: '体谅个人情况，灵活处理', type: 'F' } },
    { id: 20, text: '别人批评你时，你更在意：', dimension: 'TF', optionA: { text: '批评是否有道理', type: 'T' }, optionB: { text: '对方的态度和措辞', type: 'F' } },
    { id: 21, text: '在争论中，你更倾向于：', dimension: 'TF', optionA: { text: '坚持正确的观点，即使会伤害感情', type: 'T' }, optionB: { text: '维护和谐关系，避免冲突', type: 'F' } },
    { id: 22, text: '评价一件事时，你更注重：', dimension: 'TF', optionA: { text: '它是否合理有效', type: 'T' }, optionB: { text: '它对人们的影响', type: 'F' } },
    { id: 23, text: '你觉得自己更擅长：', dimension: 'TF', optionA: { text: '分析和解决问题', type: 'T' }, optionB: { text: '理解和支持他人', type: 'F' } },
    { id: 24, text: '面对矛盾时，你认为：', dimension: 'TF', optionA: { text: '真相比感受更重要', type: 'T' }, optionB: { text: '人的感受比对错更重要', type: 'F' } },

    // J/P 维度 (8题)
    { id: 25, text: '你更喜欢的生活方式是：', dimension: 'JP', optionA: { text: '有计划、有组织的生活', type: 'J' }, optionB: { text: '灵活随性、随机应变', type: 'P' } },
    { id: 26, text: '面对截止日期，你通常：', dimension: 'JP', optionA: { text: '提前完成，不喜欢拖延', type: 'J' }, optionB: { text: '临近截止日期才全力冲刺', type: 'P' } },
    { id: 27, text: '去旅行时，你倾向于：', dimension: 'JP', optionA: { text: '提前规划好行程', type: 'J' }, optionB: { text: '走到哪算哪，随兴而行', type: 'P' } },
    { id: 28, text: '你的工作区域通常是：', dimension: 'JP', optionA: { text: '整齐有序，物品归类', type: 'J' }, optionB: { text: '看起来有点乱，但自己知道东西在哪', type: 'P' } },
    { id: 29, text: '做决定时，你更倾向于：', dimension: 'JP', optionA: { text: '尽快做出决定并执行', type: 'J' }, optionB: { text: '保持开放，继续收集信息', type: 'P' } },
    { id: 30, text: '你认为规则：', dimension: 'JP', optionA: { text: '应该被遵守，提供秩序', type: 'J' }, optionB: { text: '可以灵活变通，视情况而定', type: 'P' } },
    { id: 31, text: '计划突然改变时，你会：', dimension: 'JP', optionA: { text: '感到不适应，需要调整', type: 'J' }, optionB: { text: '轻松接受，适应变化', type: 'P' } },
    { id: 32, text: '你更享受：', dimension: 'JP', optionA: { text: '完成任务的成就感', type: 'J' }, optionB: { text: '开始新项目的兴奋感', type: 'P' } },
];

// 16种人格类型详细信息
const PERSONALITY_TYPES: Record<string, PersonalityType> = {
    'INTJ': {
        type: 'INTJ',
        name: '建筑师',
        title: '独立思考的战略家',
        description: 'INTJ是具有想象力的战略家，有着雄心勃勃的长期计划。他们独立自主，追求知识和能力，善于将理论转化为可行的行动计划。',
        strengths: ['战略思维', '独立自主', '意志坚定', '善于规划', '知识渊博'],
        weaknesses: ['过于自信', '不够圆滑', '对他人要求高', '情感表达较少'],
        careers: ['科学家', '工程师', '战略顾问', '投资分析师', '软件架构师'],
        celebrities: ['埃隆·马斯克', '马克·扎克伯格', '尼古拉·特斯拉'],
        color: '#6366f1'
    },
    'INTP': {
        type: 'INTP',
        name: '逻辑学家',
        title: '创新的发明家',
        description: 'INTP是富有创造力的逻辑思考者，对知识有着无尽的渴望。他们喜欢分析复杂问题，追求理论的完美和逻辑的一致性。',
        strengths: ['分析能力强', '思维开放', '客观公正', '创造力强', '独立思考'],
        weaknesses: ['不切实际', '社交能力弱', '容易分心', '过度思考'],
        careers: ['程序员', '数学家', '哲学家', '研究员', '技术分析师'],
        celebrities: ['爱因斯坦', '比尔·盖茨', '玛丽·居里'],
        color: '#8b5cf6'
    },
    'ENTJ': {
        type: 'ENTJ',
        name: '指挥官',
        title: '果断的领导者',
        description: 'ENTJ是天生的领导者，具有强大的意志力和决心。他们善于组织人员和资源来实现长期目标，追求效率和成就。',
        strengths: ['领导力强', '自信果断', '高效执行', '战略眼光', '意志坚定'],
        weaknesses: ['固执己见', '缺乏耐心', '过于强势', '对情感不敏感'],
        careers: ['CEO', '创业者', '律师', '管理顾问', '政治家'],
        celebrities: ['史蒂夫·乔布斯', '戈登·拉姆齐', '玛格丽特·撒切尔'],
        color: '#dc2626'
    },
    'ENTP': {
        type: 'ENTP',
        name: '辩论家',
        title: '机智的思想家',
        description: 'ENTP是聪明好辩的思想家，喜欢智力挑战和辩论。他们富有创造力，善于发现新的可能性，不惧怕挑战传统观念。',
        strengths: ['思维敏捷', '创意丰富', '善于辩论', '适应力强', '知识广博'],
        weaknesses: ['好辩', '缺乏耐心', '不够务实', '容易厌倦'],
        careers: ['创业者', '记者', '律师', '营销顾问', '产品经理'],
        celebrities: ['托马斯·爱迪生', '塞琳娜·威廉姆斯', '罗伯特·唐尼'],
        color: '#f59e0b'
    },
    'INFJ': {
        type: 'INFJ',
        name: '提倡者',
        title: '有远见的利他主义者',
        description: 'INFJ是理想主义者，有着深刻的洞察力和强烈的价值观。他们追求有意义的人生，致力于帮助他人实现潜能。',
        strengths: ['洞察力强', '有创意', '意志坚定', '富有同情心', '追求意义'],
        weaknesses: ['过于完美主义', '容易倦怠', '不喜冲突', '过于敏感'],
        careers: ['心理咨询师', '作家', '人力资源', '教师', '社工'],
        celebrities: ['马丁·路德·金', '特蕾莎修女', '甘地'],
        color: '#10b981'
    },
    'INFP': {
        type: 'INFP',
        name: '调停者',
        title: '理想主义的治愈者',
        description: 'INFP是富有同情心的理想主义者，追求内心的和谐与真实。他们有丰富的内心世界，渴望理解他人并帮助他们成长。',
        strengths: ['富有同情心', '创造力强', '思想开放', '热情专注', '追求和谐'],
        weaknesses: ['过于理想化', '不切实际', '情绪化', '自我批评'],
        careers: ['作家', '艺术家', '心理咨询师', '人力资源', '社会工作者'],
        celebrities: ['威廉·莎士比亚', '约翰·列侬', '威廉·华莱士'],
        color: '#06b6d4'
    },
    'ENFJ': {
        type: 'ENFJ',
        name: '主人公',
        title: '鼓舞人心的领导者',
        description: 'ENFJ是充满魅力和同情心的领导者，善于激励他人发挥潜能。他们关心他人的成长，乐于帮助人们实现目标。',
        strengths: ['领导魅力', '善于激励', '同理心强', '组织能力强', '可靠负责'],
        weaknesses: ['过度理想化', '过于敏感', '自我牺牲', '难以决断'],
        careers: ['教师', '培训师', '人力资源总监', '公关', '销售经理'],
        celebrities: ['奥巴马', '奥普拉·温弗瑞', '本·阿弗莱克'],
        color: '#ec4899'
    },
    'ENFP': {
        type: 'ENFP',
        name: '竞选者',
        title: '热情的创意者',
        description: 'ENFP是热情洋溢的理想主义者，充满创造力和好奇心。他们善于发现他人的潜力，喜欢探索新的可能性。',
        strengths: ['热情开朗', '创意丰富', '善于沟通', '适应力强', '善解人意'],
        weaknesses: ['难以专注', '过于理想化', '情绪化', '不喜规划'],
        careers: ['记者', '演员', '咨询师', '创意总监', '公关'],
        celebrities: ['罗宾·威廉姆斯', '威尔·史密斯', '艾伦·德杰尼勒斯'],
        color: '#f97316'
    },
    'ISTJ': {
        type: 'ISTJ',
        name: '物流师',
        title: '可靠的实干家',
        description: 'ISTJ是勤奋可靠的传统主义者，重视责任和承诺。他们做事有条不紊，注重细节，是值得信赖的团队成员。',
        strengths: ['可靠负责', '注重细节', '耐心专注', '诚实正直', '组织能力强'],
        weaknesses: ['固执己见', '不够灵活', '过于严肃', '情感表达少'],
        careers: ['会计师', '项目经理', '法官', '军人', '系统管理员'],
        celebrities: ['沃伦·巴菲特', '安格拉·默克尔', '乔治·华盛顿'],
        color: '#64748b'
    },
    'ISFJ': {
        type: 'ISFJ',
        name: '守卫者',
        title: '温暖的守护者',
        description: 'ISFJ是热心肠的保护者，忠诚可靠，总是愿意帮助他人。他们注重和谐的人际关系，在默默中为他人付出。',
        strengths: ['忠诚可靠', '乐于助人', '观察细致', '耐心负责', '务实'],
        weaknesses: ['过于无私', '不善拒绝', '抗拒变化', '过于谦虚'],
        careers: ['护士', '教师', '行政助理', '社工', '室内设计师'],
        celebrities: ['碧昂丝', '凯特王妃', '武则天'],
        color: '#0ea5e9'
    },
    'ESTJ': {
        type: 'ESTJ',
        name: '总经理',
        title: '高效的管理者',
        description: 'ESTJ是高效务实的管理者，善于组织和领导。他们重视秩序和传统，是可靠的执行者和决策者。',
        strengths: ['组织能力强', '负责可靠', '意志坚定', '直接坦率', '务实高效'],
        weaknesses: ['固执己见', '不够灵活', '过于强势', '对情感不敏感'],
        careers: ['企业管理者', '销售经理', '法官', '财务总监', '军官'],
        celebrities: ['亨利·福特', '希拉里·克林顿', '约翰·D·洛克菲勒'],
        color: '#1d4ed8'
    },
    'ESFJ': {
        type: 'ESFJ',
        name: '执政官',
        title: '热心的主人',
        description: 'ESFJ是热情好客的社交者，关心他人的需求和感受。他们善于创造和谐的社交环境，乐于帮助他人。',
        strengths: ['热情友好', '忠诚可靠', '善于照顾', '组织能力强', '责任心强'],
        weaknesses: ['过于在意他人看法', '不善处理批评', '过于无私', '不够灵活'],
        careers: ['护士', '教师', '人力资源', '销售', '活动策划'],
        celebrities: ['泰勒·斯威夫特', '詹妮弗·洛佩兹', '休·杰克曼'],
        color: '#db2777'
    },
    'ISTP': {
        type: 'ISTP',
        name: '鉴赏家',
        title: '灵活的工匠',
        description: 'ISTP是灵活务实的问题解决者，善于用双手和工具解决实际问题。他们冷静理性，喜欢探索事物的运作方式。',
        strengths: ['灵活务实', '冷静理性', '动手能力强', '善于解决问题', '独立自主'],
        weaknesses: ['情感表达少', '不喜承诺', '冒险倾向', '不够敏感'],
        careers: ['工程师', '技术专家', '飞行员', '运动员', '侦探'],
        celebrities: ['迈克尔·乔丹', '克林特·伊斯特伍德', '布鲁斯·李'],
        color: '#4b5563'
    },
    'ISFP': {
        type: 'ISFP',
        name: '探险家',
        title: '温和的艺术家',
        description: 'ISFP是温和敏感的艺术家，有着强烈的美学意识和创造力。他们重视个人价值观，喜欢用行动表达自己。',
        strengths: ['艺术感强', '善良温和', '灵活适应', '善于观察', '忠于自我'],
        weaknesses: ['过于敏感', '不善规划', '竞争意识弱', '难以表达'],
        careers: ['艺术家', '设计师', '摄影师', '厨师', '兽医'],
        celebrities: ['迈克尔·杰克逊', '玛丽莲·梦露', '大卫·鲍伊'],
        color: '#22c55e'
    },
    'ESTP': {
        type: 'ESTP',
        name: '企业家',
        title: '精力充沛的冒险家',
        description: 'ESTP是精力充沛的行动派，喜欢冒险和刺激。他们善于察言观色，能够快速适应变化的环境并抓住机会。',
        strengths: ['行动力强', '适应力强', '务实灵活', '社交能力强', '善于谈判'],
        weaknesses: ['缺乏耐心', '冒险倾向', '不善规划', '可能不够敏感'],
        careers: ['销售', '创业者', '运动员', '演员', '急救人员'],
        celebrities: ['唐纳德·特朗普', '麦当娜', '杰克·尼科尔森'],
        color: '#ef4444'
    },
    'ESFP': {
        type: 'ESFP',
        name: '表演者',
        title: '热情的娱乐家',
        description: 'ESFP是热情活泼的表演者，喜欢成为关注的焦点。他们享受当下，善于让周围的人感到快乐和放松。',
        strengths: ['热情友好', '活力四射', '善于观察', '务实灵活', '乐于助人'],
        weaknesses: ['难以专注', '不善规划', '过于敏感', '容易厌倦'],
        careers: ['演员', '销售', '活动策划', '教练', '空乘人员'],
        celebrities: ['玛丽莲·梦露', '杰米·福克斯', '艾迪·墨菲'],
        color: '#a855f7'
    },
};

// localStorage key
const MBTI_ANSWERS_KEY = 'freetool-mbti-answers';
const MBTI_RESULT_KEY = 'freetool-mbti-result';

type TestState = 'intro' | 'testing' | 'result';

const MBTITestTool: React.FC = () => {
    const [testState, setTestState] = useState<TestState>('intro');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [result, setResult] = useState<PersonalityType | null>(null);
    const [scores, setScores] = useState<Record<string, number>>({});

    // 加载保存的结果
    useEffect(() => {
        try {
            const savedResult = localStorage.getItem(MBTI_RESULT_KEY);
            const savedScores = localStorage.getItem('freetool-mbti-scores');
            if (savedResult && savedScores) {
                const parsedResult = JSON.parse(savedResult);
                const parsedScores = JSON.parse(savedScores);
                if (PERSONALITY_TYPES[parsedResult.type]) {
                    setResult(parsedResult);
                    setScores(parsedScores);
                    setTestState('result');
                }
            }
        } catch (e) {
            console.error('Failed to load MBTI result:', e);
        }
    }, []);

    // 开始测试
    const startTest = useCallback(() => {
        setTestState('testing');
        setCurrentQuestion(0);
        setAnswers([]);
        setResult(null);
        setScores({});
        localStorage.removeItem(MBTI_ANSWERS_KEY);
        localStorage.removeItem(MBTI_RESULT_KEY);
    }, []);

    // 回答问题
    const answerQuestion = useCallback((selectedType: string) => {
        const newAnswer: Answer = {
            questionId: QUESTIONS[currentQuestion].id,
            selectedType,
        };

        const newAnswers = [...answers, newAnswer];
        setAnswers(newAnswers);

        if (currentQuestion < QUESTIONS.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // 计算结果
            calculateResult(newAnswers);
        }
    }, [currentQuestion, answers]);

    // 返回上一题
    const goBack = useCallback(() => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
            setAnswers(answers.slice(0, -1));
        }
    }, [currentQuestion, answers]);

    // 计算MBTI结果
    const calculateResult = useCallback((allAnswers: Answer[]) => {
        const dimensionScores: Record<string, number> = {
            E: 0, I: 0,
            S: 0, N: 0,
            T: 0, F: 0,
            J: 0, P: 0,
        };

        allAnswers.forEach(answer => {
            dimensionScores[answer.selectedType]++;
        });

        const mbtiType = [
            dimensionScores.E >= dimensionScores.I ? 'E' : 'I',
            dimensionScores.S >= dimensionScores.N ? 'S' : 'N',
            dimensionScores.T >= dimensionScores.F ? 'T' : 'F',
            dimensionScores.J >= dimensionScores.P ? 'J' : 'P',
        ].join('');

        const personalityResult = PERSONALITY_TYPES[mbtiType];

        // 计算百分比
        const percentageScores = {
            E: Math.round((dimensionScores.E / 8) * 100),
            I: Math.round((dimensionScores.I / 8) * 100),
            S: Math.round((dimensionScores.S / 8) * 100),
            N: Math.round((dimensionScores.N / 8) * 100),
            T: Math.round((dimensionScores.T / 8) * 100),
            F: Math.round((dimensionScores.F / 8) * 100),
            J: Math.round((dimensionScores.J / 8) * 100),
            P: Math.round((dimensionScores.P / 8) * 100),
        };

        setResult(personalityResult);
        setScores(percentageScores);
        setTestState('result');

        // 保存结果
        localStorage.setItem(MBTI_RESULT_KEY, JSON.stringify(personalityResult));
        localStorage.setItem('freetool-mbti-scores', JSON.stringify(percentageScores));
    }, []);

    // 重新测试
    const restartTest = useCallback(() => {
        setTestState('intro');
        setCurrentQuestion(0);
        setAnswers([]);
        setResult(null);
        setScores({});
        localStorage.removeItem(MBTI_RESULT_KEY);
        localStorage.removeItem('freetool-mbti-scores');
    }, []);

    // 进度条
    const progress = ((currentQuestion + (answers.length > currentQuestion ? 1 : 0)) / QUESTIONS.length) * 100;

    return (
        <div className="flex w-full flex-col items-center px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex w-full max-w-3xl flex-col items-center gap-2 text-center mb-6">
                <p className="text-2xl font-black leading-tight tracking-tighter text-gray-900 dark:text-white sm:text-3xl">
                    MBTI 人格测试
                </p>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    探索你的性格类型，了解真实的自己
                </p>
            </div>

            <div className="w-full max-w-3xl">
                {/* 介绍页面 */}
                {testState === 'intro' && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 sm:p-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-4xl text-white">psychology</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                迈尔斯-布里格斯类型指标
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg">
                                MBTI 是世界上最流行的性格测试之一，通过 4 个维度将人格分为 16 种类型。
                                本测试包含 32 道题目，大约需要 5-10 分钟完成。
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-md">
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="text-2xl font-bold text-primary">32</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">道测试题</div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="text-2xl font-bold text-primary">16</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">种人格类型</div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="text-2xl font-bold text-primary">4</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">个性格维度</div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="text-2xl font-bold text-primary">5-10</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">分钟完成</div>
                                </div>
                            </div>

                            <div className="text-left w-full max-w-md mb-8">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">四个维度：</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">E/I</span>
                                        <span className="text-gray-600 dark:text-gray-400">外向 vs 内向 - 能量来源</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">S/N</span>
                                        <span className="text-gray-600 dark:text-gray-400">感觉 vs 直觉 - 信息获取</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium">T/F</span>
                                        <span className="text-gray-600 dark:text-gray-400">思考 vs 情感 - 决策方式</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">J/P</span>
                                        <span className="text-gray-600 dark:text-gray-400">判断 vs 知觉 - 生活方式</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={startTest}
                                className="flex items-center justify-center gap-2 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all"
                            >
                                <span className="material-symbols-outlined">play_arrow</span>
                                开始测试
                            </button>
                        </div>
                    </div>
                )}

                {/* 测试进行中 */}
                {testState === 'testing' && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 sm:p-8">
                        {/* 进度条 */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                                <span>题目 {currentQuestion + 1} / {QUESTIONS.length}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* 问题 */}
                        <div className="mb-8">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center mb-6">
                                {QUESTIONS[currentQuestion].text}
                            </h3>

                            <div className="space-y-3">
                                <button
                                    onClick={() => answerQuestion(QUESTIONS[currentQuestion].optionA.type)}
                                    className="w-full p-4 text-left rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary bg-gray-50 dark:bg-gray-700/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold group-hover:bg-primary group-hover:text-white transition-colors">
                                            A
                                        </span>
                                        <span className="text-gray-700 dark:text-gray-300 pt-1">
                                            {QUESTIONS[currentQuestion].optionA.text}
                                        </span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => answerQuestion(QUESTIONS[currentQuestion].optionB.type)}
                                    className="w-full p-4 text-left rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary bg-gray-50 dark:bg-gray-700/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold group-hover:bg-primary group-hover:text-white transition-colors">
                                            B
                                        </span>
                                        <span className="text-gray-700 dark:text-gray-300 pt-1">
                                            {QUESTIONS[currentQuestion].optionB.text}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* 返回按钮 */}
                        {currentQuestion > 0 && (
                            <div className="flex justify-center">
                                <button
                                    onClick={goBack}
                                    className="flex items-center gap-1 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                                    返回上一题
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 结果页面 */}
                {testState === 'result' && result && (
                    <div className="space-y-6">
                        {/* 主要结果卡片 */}
                        <div
                            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 sm:p-8 text-center"
                            style={{ borderTopColor: result.color, borderTopWidth: '4px' }}
                        >
                            <div
                                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                                style={{ backgroundColor: `${result.color}20` }}
                            >
                                <span className="text-4xl font-black" style={{ color: result.color }}>
                                    {result.type}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                {result.name}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                {result.title}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
                                {result.description}
                            </p>
                        </div>

                        {/* 维度分析 */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                维度分析
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { left: 'E', right: 'I', leftLabel: '外向', rightLabel: '内向', color: '#3b82f6' },
                                    { left: 'S', right: 'N', leftLabel: '感觉', rightLabel: '直觉', color: '#22c55e' },
                                    { left: 'T', right: 'F', leftLabel: '思考', rightLabel: '情感', color: '#eab308' },
                                    { left: 'J', right: 'P', leftLabel: '判断', rightLabel: '知觉', color: '#a855f7' },
                                ].map(dim => (
                                    <div key={dim.left} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium" style={{ color: dim.color }}>
                                                {dim.leftLabel} ({dim.left}) {scores[dim.left]}%
                                            </span>
                                            <span className="font-medium text-gray-500 dark:text-gray-400">
                                                {scores[dim.right]}% ({dim.right}) {dim.rightLabel}
                                            </span>
                                        </div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                                            <div
                                                className="h-full transition-all duration-500"
                                                style={{
                                                    width: `${scores[dim.left]}%`,
                                                    backgroundColor: dim.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 优势和劣势 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-500">thumb_up</span>
                                    优势
                                </h3>
                                <ul className="space-y-2">
                                    {result.strengths.map((strength, i) => (
                                        <li key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            {strength}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-orange-500">warning</span>
                                    注意事项
                                </h3>
                                <ul className="space-y-2">
                                    {result.weaknesses.map((weakness, i) => (
                                        <li key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                            {weakness}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* 职业建议 */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">work</span>
                                适合的职业
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {result.careers.map((career, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium"
                                        style={{
                                            backgroundColor: `${result.color}15`,
                                            color: result.color
                                        }}
                                    >
                                        {career}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 同类型名人 */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-500">stars</span>
                                同类型名人
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {result.celebrities.map((celebrity, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                                    >
                                        {celebrity}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 重新测试按钮 */}
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={restartTest}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all"
                            >
                                <span className="material-symbols-outlined">refresh</span>
                                重新测试
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MBTITestTool;
