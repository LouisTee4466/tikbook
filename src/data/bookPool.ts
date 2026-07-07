// 精选知名书池：每天的 3 本书从这里选，而不是从外部 API 随机抓。
// 全部是公认的经典/畅销书 => 模型训练知识充足 => 摘要具体且可靠。
// 字段: id(slug), title, author, year, genres(用于偏好学习), topics, desc(一句话定位)
export interface PoolBook {
  id: string;
  title: string;
  author: string;
  year: number;
  genres: string[];
  topics: string[];
  desc: string;
}

function b(
  id: string,
  title: string,
  author: string,
  year: number,
  genres: string[],
  topics: string[],
  desc: string,
): PoolBook {
  return { id, title, author, year, genres, topics, desc };
}

export const BOOK_POOL: PoolBook[] = [
  // ================= 个人成长 / 效率 =================
  b("atomic-habits", "原子习惯 (Atomic Habits)", "James Clear", 2018, ["个人成长"], ["习惯", "行为改变"], "用微小习惯的复利效应实现巨大改变的实用体系"),
  b("deep-work", "深度工作 (Deep Work)", "Cal Newport", 2016, ["个人成长", "效率"], ["专注力", "知识工作"], "在分心时代通过深度专注创造高价值产出"),
  b("7-habits", "高效能人士的七个习惯 (The 7 Habits of Highly Effective People)", "Stephen R. Covey", 1989, ["个人成长"], ["习惯", "领导力"], "以原则为中心的个人与职业效能经典框架"),
  b("getting-things-done", "搞定 (Getting Things Done)", "David Allen", 2001, ["效率"], ["时间管理", "GTD"], "把事务移出大脑、建立可信任务系统的GTD方法论"),
  b("essentialism", "精要主义 (Essentialism)", "Greg McKeown", 2014, ["个人成长", "效率"], ["取舍", "专注"], "更少但更好：系统性地追求真正重要之事"),
  b("power-of-habit", "习惯的力量 (The Power of Habit)", "Charles Duhigg", 2012, ["个人成长", "心理学"], ["习惯回路", "行为科学"], "习惯回路的科学原理及个人与组织的改变之道"),
  b("mindset", "终身成长 (Mindset)", "Carol Dweck", 2006, ["个人成长", "心理学"], ["成长型思维"], "固定型与成长型思维如何决定成就与幸福"),
  b("grit", "坚毅 (Grit)", "Angela Duckworth", 2016, ["个人成长", "心理学"], ["毅力", "成就"], "激情与坚持比天赋更能预测长期成功"),
  b("so-good-they-cant-ignore", "优秀到不能被忽视 (So Good They Can't Ignore You)", "Cal Newport", 2012, ["个人成长", "职业"], ["职业资本", "技能"], "反驳追随激情论，以技能积累构建理想职业"),
  b("make-time", "赢回专注力 (Make Time)", "Jake Knapp & John Zeratsky", 2018, ["效率"], ["专注", "精力管理"], "每天为最重要的事设定焦点的轻量方法"),
  b("four-thousand-weeks", "四千周 (Four Thousand Weeks)", "Oliver Burkeman", 2021, ["个人成长", "哲学"], ["时间", "有限性"], "接受生命有限，从时间管理焦虑中解放"),
  b("miracle-morning", "早起的奇迹 (The Miracle Morning)", "Hal Elrod", 2012, ["个人成长"], ["晨间习惯"], "用晨间例行程序改变一天与人生"),
  b("eat-that-frog", "吃掉那只青蛙 (Eat That Frog!)", "Brian Tracy", 2001, ["效率"], ["拖延", "优先级"], "先做最难最重要之事的反拖延法则"),
  b("tiny-habits", "福格行为模型 (Tiny Habits)", "BJ Fogg", 2019, ["个人成长", "心理学"], ["行为设计"], "B=MAP行为模型：从微小起步设计持久改变"),
  b("ultralearning", "超级学习者 (Ultralearning)", "Scott Young", 2019, ["个人成长", "学习"], ["自学", "元学习"], "高强度自主学习的九大原则"),
  b("range", "成长的边界 (Range)", "David Epstein", 2019, ["个人成长", "科学"], ["通才", "跨界"], "通才为何能在专业化世界中胜出"),

  // ================= 心理学 =================
  b("thinking-fast-slow", "思考，快与慢 (Thinking, Fast and Slow)", "Daniel Kahneman", 2011, ["心理学"], ["决策", "认知偏差"], "诺奖得主对系统1与系统2双过程思维的集大成之作"),
  b("influence", "影响力 (Influence)", "Robert Cialdini", 1984, ["心理学"], ["说服", "社会心理"], "互惠、承诺、社会认同等六大说服原理"),
  b("predictably-irrational", "怪诞行为学 (Predictably Irrational)", "Dan Ariely", 2008, ["心理学", "经济学"], ["行为经济学"], "人类非理性行为的系统性与可预测性"),
  b("flow", "心流 (Flow)", "Mihaly Csikszentmihalyi", 1990, ["心理学"], ["心流", "幸福"], "最优体验心理学：全神贯注带来的幸福"),
  b("emotional-intelligence", "情商 (Emotional Intelligence)", "Daniel Goleman", 1995, ["心理学"], ["情绪管理"], "情绪智力为何比智商更影响人生成就"),
  b("quiet", "内向者优势 (Quiet)", "Susan Cain", 2012, ["心理学"], ["内向", "性格"], "在喋喋不休的世界里内向者的力量"),
  b("stumbling-happiness", "撞上幸福 (Stumbling on Happiness)", "Daniel Gilbert", 2006, ["心理学"], ["幸福", "预测"], "为什么我们总是错误预测什么让自己幸福"),
  b("man-search-meaning", "活出生命的意义 (Man's Search for Meaning)", "Viktor Frankl", 1946, ["心理学", "哲学"], ["意义", "苦难"], "集中营幸存者对意义疗法的奠基之作"),
  b("body-keeps-score", "身体从未忘记 (The Body Keeps the Score)", "Bessel van der Kolk", 2014, ["心理学", "健康"], ["创伤", "疗愈"], "创伤如何重塑大脑与身体及其疗愈路径"),
  b("games-people-play", "人间游戏 (Games People Play)", "Eric Berne", 1964, ["心理学"], ["人际关系", "沟通分析"], "人际互动中的心理游戏与角色剧本"),
  b("courage-disliked", "被讨厌的勇气", "岸见一郎 & 古贺史健", 2013, ["心理学", "哲学"], ["阿德勒", "自由"], "以对话体阐释阿德勒心理学：课题分离与被讨厌的勇气"),
  b("attached", "依恋 (Attached)", "Amir Levine & Rachel Heller", 2010, ["心理学"], ["亲密关系", "依恋理论"], "成人依恋类型如何塑造亲密关系"),
  b("nudge", "助推 (Nudge)", "Richard Thaler & Cass Sunstein", 2008, ["心理学", "经济学"], ["选择架构"], "不禁止不强制，用选择设计改善决策"),
  b("righteous-mind", "正义之心 (The Righteous Mind)", "Jonathan Haidt", 2012, ["心理学", "社科"], ["道德", "政治分歧"], "道德直觉的六大基础与政治分歧的心理根源"),
  b("subtle-art", "重塑幸福 (The Subtle Art of Not Giving a F*ck)", "Mark Manson", 2016, ["心理学", "个人成长"], ["价值观", "接纳"], "反鸡汤：选对在乎的事，接纳有限与失败"),
  b("scarcity-mindset", "稀缺 (Scarcity)", "Sendhil Mullainathan & Eldar Shafir", 2013, ["心理学", "经济学"], ["稀缺心态", "带宽"], "稀缺如何俘获注意力并让穷者愈穷、忙者愈忙"),

  // ================= 商业 / 管理 =================
  b("lean-startup", "精益创业 (The Lean Startup)", "Eric Ries", 2011, ["商业"], ["创业", "MVP"], "构建-测量-学习循环与最小可行产品方法论"),
  b("zero-to-one", "从0到1 (Zero to One)", "Peter Thiel", 2014, ["商业"], ["创业", "垄断"], "创造新事物的逆向思考：竞争是失败者的游戏"),
  b("good-to-great", "从优秀到卓越 (Good to Great)", "Jim Collins", 2001, ["商业", "管理"], ["企业研究", "领导力"], "卓越公司区别于优秀公司的实证规律"),
  b("innovators-dilemma", "创新者的窘境 (The Innovator's Dilemma)", "Clayton Christensen", 1997, ["商业"], ["颠覆式创新"], "好公司为何败于颠覆式创新的经典理论"),
  b("hard-thing", "创业维艰 (The Hard Thing About Hard Things)", "Ben Horowitz", 2014, ["商业", "管理"], ["创业", "CEO"], "没有公式可循的创业至暗时刻实战手记"),
  b("high-output", "格鲁夫给经理人的第一课 (High Output Management)", "Andrew Grove", 1983, ["管理"], ["产出", "管理杠杆"], "英特尔传奇CEO的经理人产出方法论"),
  b("start-with-why", "从「为什么」开始 (Start with Why)", "Simon Sinek", 2009, ["商业", "领导力"], ["黄金圈", "使命"], "伟大领袖与品牌都从Why出发的黄金圈法则"),
  b("built-to-last", "基业长青 (Built to Last)", "Jim Collins & Jerry Porras", 1994, ["商业", "管理"], ["愿景公司"], "高瞻远瞩公司的永续基因"),
  b("blue-ocean", "蓝海战略 (Blue Ocean Strategy)", "W. Chan Kim & Renée Mauborgne", 2005, ["商业"], ["战略", "价值创新"], "跳出红海竞争、开创无人争抢的市场空间"),
  b("crossing-chasm", "跨越鸿沟 (Crossing the Chasm)", "Geoffrey Moore", 1991, ["商业"], ["技术营销", "采用周期"], "高科技产品从早期用户走向主流市场的鸿沟"),
  b("hooked", "上瘾 (Hooked)", "Nir Eyal", 2014, ["商业", "产品"], ["习惯养成产品"], "触发-行动-多变奖励-投入的上瘾模型"),
  b("shoe-dog", "鞋狗 (Shoe Dog)", "Phil Knight", 2016, ["商业", "传记"], ["耐克", "创业"], "耐克创始人亲述草根创业的狂热与挣扎"),
  b("principles", "原则 (Principles)", "Ray Dalio", 2017, ["商业", "个人成长"], ["决策原则", "极度透明"], "桥水创始人的生活与工作原则体系"),
  b("made-to-stick", "让创意更有黏性 (Made to Stick)", "Chip Heath & Dan Heath", 2007, ["商业", "沟通"], ["传播", "创意"], "简单意外具体可信情感故事：让观点被记住"),
  b("never-split", "掌控谈话 (Never Split the Difference)", "Chris Voss", 2016, ["商业", "沟通"], ["谈判"], "FBI人质谈判专家的战术同理心谈判术"),
  b("measure-what-matters", "这就是OKR (Measure What Matters)", "John Doerr", 2018, ["管理"], ["OKR", "目标管理"], "谷歌与英特尔验证的目标与关键结果法"),
  b("no-rules-rules", "不拘一格 (No Rules Rules)", "Reed Hastings & Erin Meyer", 2020, ["管理", "商业"], ["网飞", "企业文化"], "网飞的自由与责任文化如何炼成"),
  b("psychology-of-money", "金钱心理学 (The Psychology of Money)", "Morgan Housel", 2020, ["商业", "理财"], ["财富观", "行为金融"], "与金钱相处的智慧比金融知识更重要"),

  // ================= 经济学 / 理财 =================
  b("rich-dad", "富爸爸穷爸爸 (Rich Dad Poor Dad)", "Robert Kiyosaki", 1997, ["理财"], ["财商", "资产"], "资产与负债之分：财商启蒙的全球畅销书"),
  b("intelligent-investor", "聪明的投资者 (The Intelligent Investor)", "Benjamin Graham", 1949, ["理财", "投资"], ["价值投资"], "价值投资圣经：市场先生与安全边际"),
  b("random-walk", "漫步华尔街 (A Random Walk Down Wall Street)", "Burton Malkiel", 1973, ["理财", "投资"], ["指数基金", "有效市场"], "为什么普通人应该买指数基金"),
  b("freakonomics", "魔鬼经济学 (Freakonomics)", "Steven Levitt & Stephen Dubner", 2005, ["经济学"], ["激励", "数据"], "用经济学透镜解剖日常世界的隐藏一面"),
  b("capital-21", "21世纪资本论 (Capital in the Twenty-First Century)", "Thomas Piketty", 2013, ["经济学"], ["不平等", "财富分配"], "r>g：资本回报率超过增长率导致的不平等"),
  b("poor-economics", "贫穷的本质 (Poor Economics)", "Abhijit Banerjee & Esther Duflo", 2011, ["经济学"], ["贫困", "发展经济学"], "诺奖得主用随机实验揭示穷人的经济逻辑"),
  b("misbehaving", "错误的行为 (Misbehaving)", "Richard Thaler", 2015, ["经济学", "心理学"], ["行为经济学史"], "行为经济学之父亲述这门学科的诞生"),
  b("black-swan", "黑天鹅 (The Black Swan)", "Nassim Taleb", 2007, ["经济学", "哲学"], ["不确定性", "极端事件"], "极端罕见事件如何主宰历史与市场"),
  b("antifragile", "反脆弱 (Antifragile)", "Nassim Taleb", 2012, ["经济学", "哲学"], ["反脆弱性"], "从波动与混乱中受益的系统设计"),
  b("wealth-of-nations", "国富论 (The Wealth of Nations)", "Adam Smith", 1776, ["经济学"], ["古典经济学", "分工"], "看不见的手：现代经济学的奠基之作"),
  b("simple-path-wealth", "财富自由之路 (The Simple Path to Wealth)", "JL Collins", 2016, ["理财"], ["指数投资", "FIRE"], "写给女儿的极简指数投资与财务自由指南"),
  b("millionaire-next-door", "邻家的百万富翁 (The Millionaire Next Door)", "Thomas Stanley & William Danko", 1996, ["理财"], ["储蓄", "富人研究"], "真实富人的朴素生活方式画像"),

  // ================= 科学 / 技术 =================
  b("sapiens", "人类简史 (Sapiens)", "Yuval Noah Harari", 2011, ["历史", "科学"], ["认知革命", "人类演化"], "从认知革命到科学革命的人类大历史"),
  b("homo-deus", "未来简史 (Homo Deus)", "Yuval Noah Harari", 2015, ["科学", "历史"], ["未来", "数据主义"], "当人类战胜饥荒瘟疫战争之后追求什么"),
  b("brief-history-time", "时间简史 (A Brief History of Time)", "Stephen Hawking", 1988, ["科学"], ["宇宙学", "黑洞"], "从大爆炸到黑洞的宇宙学科普经典"),
  b("selfish-gene", "自私的基因 (The Selfish Gene)", "Richard Dawkins", 1976, ["科学"], ["演化论", "基因"], "以基因视角重述演化论并提出模因概念"),
  b("gene-intimate-history", "基因传 (The Gene: An Intimate History)", "Siddhartha Mukherjee", 2016, ["科学"], ["遗传学", "医学"], "基因概念的科学史与伦理未来"),
  b("cosmos", "宇宙 (Cosmos)", "Carl Sagan", 1980, ["科学"], ["天文", "科学精神"], "萨根献给宇宙与科学精神的抒情诗"),
  b("guns-germs-steel", "枪炮、病菌与钢铁 (Guns, Germs, and Steel)", "Jared Diamond", 1997, ["历史", "科学"], ["地理决定论", "文明"], "地理与环境如何塑造各大陆文明的命运"),
  b("silent-spring", "寂静的春天 (Silent Spring)", "Rachel Carson", 1962, ["科学"], ["环保", "生态"], "开启现代环保运动的里程碑之作"),
  b("emperor-maladies", "众病之王：癌症传 (The Emperor of All Maladies)", "Siddhartha Mukherjee", 2010, ["科学", "健康"], ["癌症", "医学史"], "普利策奖癌症四千年抗争史"),
  b("immortal-henrietta", "永生的海拉 (The Immortal Life of Henrietta Lacks)", "Rebecca Skloot", 2010, ["科学"], ["医学伦理", "细胞"], "海拉细胞背后的科学奇迹与伦理拷问"),
  b("thinking-in-systems", "系统之美 (Thinking in Systems)", "Donella Meadows", 2008, ["科学", "思维"], ["系统思维"], "存量流量反馈回路：系统思考入门经典"),
  b("code-book", "码书 (The Code Book)", "Simon Singh", 1999, ["科学", "技术"], ["密码学"], "从凯撒密码到量子密码的密码学史诗"),
  b("innovators", "创新者 (The Innovators)", "Walter Isaacson", 2014, ["技术", "历史"], ["计算机史", "协作"], "数字革命群像：天才与团队如何创造计算机时代"),
  b("superintelligence", "超级智能 (Superintelligence)", "Nick Bostrom", 2014, ["技术", "哲学"], ["人工智能", "存在风险"], "机器智能超越人类之后的路径与危险"),
  b("life-3", "生命3.0 (Life 3.0)", "Max Tegmark", 2017, ["技术", "科学"], ["人工智能", "未来"], "AI时代生命形态与人类命运的大图景"),
  b("shortest-history-universe", "起源：万物大历史 (Origin Story)", "David Christian", 2018, ["科学", "历史"], ["大历史"], "从大爆炸到互联网的138亿年通史"),

  // ================= 历史 =================
  b("1587", "万历十五年", "黄仁宇", 1982, ["历史"], ["明史", "大历史观"], "以平淡一年透视明代体制的深层困局"),
  b("global-history", "全球通史 (A Global History)", "L.S. Stavrianos", 1970, ["历史"], ["世界史"], "站在月球看地球的全球视角通史"),
  b("rise-fall-third-reich", "第三帝国的兴亡 (The Rise and Fall of the Third Reich)", "William Shirer", 1960, ["历史"], ["纳粹", "二战"], "记者亲历与档案写就的纳粹德国全史"),
  b("story-of-art", "艺术的故事 (The Story of Art)", "E.H. Gombrich", 1950, ["历史", "艺术"], ["艺术史"], "没有大写艺术只有艺术家的艺术史入门圣经"),
  b("silk-roads", "丝绸之路 (The Silk Roads)", "Peter Frankopan", 2015, ["历史"], ["中亚", "世界史"], "以丝路为中心重写的世界史"),
  b("1776", "1776 (1776)", "David McCullough", 2005, ["历史"], ["美国独立"], "华盛顿与大陆军命悬一线的建国之年"),
  b("swerve", "大转向 (The Swerve)", "Stephen Greenblatt", 2011, ["历史"], ["文艺复兴", "思想史"], "一部古书的重现如何点燃现代世界"),
  b("china-history-deng", "邓小平时代", "傅高义", 2011, ["历史", "传记"], ["改革开放", "中国"], "哈佛学者笔下的邓小平与中国转型"),
  b("shortest-history-china", "极简中国史概览 (The Shortest History of China)", "Linda Jaivin", 2021, ["历史"], ["中国史"], "一册纵览从上古到当代的中国"),
  b("postwar", "战后欧洲史 (Postwar)", "Tony Judt", 2005, ["历史"], ["欧洲", "冷战"], "1945年以来欧洲的分裂与重生"),

  // ================= 哲学 / 思想 =================
  b("meditations", "沉思录 (Meditations)", "Marcus Aurelius", 180, ["哲学"], ["斯多葛"], "罗马皇帝写给自己的斯多葛哲学笔记"),
  b("republic", "理想国 (The Republic)", "Plato", -380, ["哲学"], ["正义", "政治哲学"], "关于正义与理想城邦的对话录奠基之作"),
  b("nicomachean-ethics", "尼各马可伦理学 (Nicomachean Ethics)", "Aristotle", -340, ["哲学"], ["美德", "幸福"], "亚里士多德论幸福与美德的伦理学经典"),
  b("thus-spoke-zarathustra", "查拉图斯特拉如是说 (Thus Spoke Zarathustra)", "Friedrich Nietzsche", 1883, ["哲学"], ["超人", "价值重估"], "尼采以诗性寓言宣告超人哲学"),
  b("tao-te-ching", "道德经", "老子", -500, ["哲学"], ["道家", "无为"], "五千言道家智慧：道法自然与无为而治"),
  b("analects", "论语", "孔子及弟子", -450, ["哲学"], ["儒家", "修身"], "儒家思想源头：仁与礼的对话录"),
  b("zhuangzi", "庄子", "庄周", -300, ["哲学"], ["道家", "逍遥"], "逍遥游与齐物论：想象力纵横的道家经典"),
  b("justice-sandel", "公正 (Justice)", "Michael Sandel", 2009, ["哲学"], ["伦理", "政治哲学"], "哈佛公开课：该如何做是好的道德推理之旅"),
  b("sophies-world", "苏菲的世界 (Sophie's World)", "Jostein Gaarder", 1991, ["哲学", "小说"], ["哲学史"], "以少女奇遇串起整部西方哲学史"),
  b("guide-good-life", "像哲学家一样生活 (A Guide to the Good Life)", "William Irvine", 2008, ["哲学", "个人成长"], ["斯多葛实践"], "斯多葛主义的现代生活操作手册"),
  b("letters-stoic", "塞涅卡道德书简 (Letters from a Stoic)", "Seneca", 65, ["哲学"], ["斯多葛", "书信"], "塞涅卡论时间、财富与死亡的书简"),
  b("being-time-intro", "存在主义咖啡馆 (At the Existentialist Café)", "Sarah Bakewell", 2016, ["哲学"], ["存在主义"], "萨特波伏娃海德格尔们的思想群像"),

  // ================= 社科 / 文化 =================
  b("outliers", "异类 (Outliers)", "Malcolm Gladwell", 2008, ["社科"], ["成功学", "一万小时"], "成功者背后的机遇、文化与积累"),
  b("tipping-point", "引爆点 (The Tipping Point)", "Malcolm Gladwell", 2000, ["社科"], ["流行", "传播"], "小事如何引发大流行的三大法则"),
  b("talking-strangers", "与陌生人交谈 (Talking to Strangers)", "Malcolm Gladwell", 2019, ["社科"], ["误判", "信任"], "为什么我们总是看错陌生人"),
  b("sapiens-graphic", "今日简史 (21 Lessons for the 21st Century)", "Yuval Noah Harari", 2018, ["社科"], ["当代议题"], "关于当下21个最紧迫问题的思考"),
  b("factfulness", "事实 (Factfulness)", "Hans Rosling", 2018, ["社科"], ["数据思维", "世界观"], "用数据修正十大本能偏见，世界比你想的好"),
  b("evicted", "扫地出门 (Evicted)", "Matthew Desmond", 2016, ["社科"], ["贫困", "住房"], "普利策奖：美国城市驱逐与贫困的民族志"),
  b("bowling-alone", "独自打保龄 (Bowling Alone)", "Robert Putnam", 2000, ["社科"], ["社会资本", "社区"], "美国社区生活衰落与社会资本流失"),
  b("weapons-math-destruction", "算法霸权 (Weapons of Math Destruction)", "Cathy O'Neil", 2016, ["社科", "技术"], ["算法", "不平等"], "大数据模型如何放大不平等"),
  b("amusing-ourselves", "娱乐至死 (Amusing Ourselves to Death)", "Neil Postman", 1985, ["社科"], ["媒介", "电视文化"], "媒介即隐喻：娱乐如何重塑公共话语"),
  b("sixth-extinction", "大灭绝时代 (The Sixth Extinction)", "Elizabeth Kolbert", 2014, ["社科", "科学"], ["物种灭绝", "环境"], "普利策奖：人类正在造成的第六次大灭绝"),
  b("fiasco-caste", "美国不平等的起源 (Caste)", "Isabel Wilkerson", 2020, ["社科"], ["种姓", "种族"], "以种姓框架重新审视美国的种族秩序"),
  b("country-driving", "寻路中国 (Country Driving)", "Peter Hessler", 2010, ["社科", "纪实"], ["中国", "城乡变迁"], "何伟驾车穿越中国城乡巨变的纪实"),

  // ================= 传记 / 回忆录 =================
  b("steve-jobs", "史蒂夫·乔布斯传 (Steve Jobs)", "Walter Isaacson", 2011, ["传记"], ["苹果", "创新"], "乔布斯授权传记：完美主义与现实扭曲力场"),
  b("musk-isaacson", "埃隆·马斯克传 (Elon Musk)", "Walter Isaacson", 2023, ["传记"], ["特斯拉", "SpaceX"], "艾萨克森贴身两年写就的马斯克传"),
  b("benjamin-franklin", "富兰克林自传 (The Autobiography of Benjamin Franklin)", "Benjamin Franklin", 1791, ["传记"], ["自我修养"], "美国精神原型：从印刷学徒到开国元勋"),
  b("long-walk-freedom", "漫漫自由路 (Long Walk to Freedom)", "Nelson Mandela", 1994, ["传记"], ["南非", "自由"], "曼德拉自传：27年铁窗与一个国家的和解"),
  b("educated", "你当像鸟飞往你的山 (Educated)", "Tara Westover", 2018, ["传记", "回忆录"], ["教育", "原生家庭"], "从山区禁锢到剑桥博士的自我教育之路"),
  b("becoming", "成为 (Becoming)", "Michelle Obama", 2018, ["传记", "回忆录"], ["白宫", "女性"], "米歇尔·奥巴马从芝加哥南区到白宫的旅程"),
  b("when-breath-air", "当呼吸化为空气 (When Breath Becomes Air)", "Paul Kalanithi", 2016, ["传记", "回忆录"], ["生死", "医学"], "天才神经外科医生面对绝症的生命追问"),
  b("da-vinci-isaacson", "列奥纳多·达·芬奇传 (Leonardo da Vinci)", "Walter Isaacson", 2017, ["传记", "艺术"], ["文艺复兴", "好奇心"], "跨界天才达芬奇的好奇心与创造力"),
  b("churchill-walking", "至暗时刻的丘吉尔 (The Splendid and the Vile)", "Erik Larson", 2020, ["传记", "历史"], ["二战", "领导力"], "闪电战之年丘吉尔的家庭与领导力"),
  b("surely-joking-feynman", "别闹了，费曼先生 (Surely You're Joking, Mr. Feynman!)", "Richard Feynman", 1985, ["传记", "科学"], ["物理", "好奇心"], "诺奖顽童物理学家的妙趣人生"),

  // ================= 小说 / 文学经典 =================
  b("to-kill-mockingbird", "杀死一只知更鸟 (To Kill a Mockingbird)", "Harper Lee", 1960, ["小说"], ["种族", "正义"], "以孩童之眼见证偏见与良知的美国经典"),
  b("1984", "一九八四 (1984)", "George Orwell", 1949, ["小说"], ["反乌托邦", "极权"], "老大哥在看着你：极权主义的终极寓言"),
  b("brave-new-world", "美丽新世界 (Brave New World)", "Aldous Huxley", 1932, ["小说"], ["反乌托邦", "科技"], "以快乐驯服人类的另一种极权"),
  b("animal-farm", "动物农场 (Animal Farm)", "George Orwell", 1945, ["小说"], ["政治寓言"], "所有动物一律平等，但有些更平等"),
  b("great-gatsby", "了不起的盖茨比 (The Great Gatsby)", "F. Scott Fitzgerald", 1925, ["小说"], ["美国梦", "爵士时代"], "绿灯彼岸：美国梦的绚烂与幻灭"),
  b("one-hundred-years", "百年孤独 (One Hundred Years of Solitude)", "Gabriel García Márquez", 1967, ["小说"], ["魔幻现实主义"], "布恩迪亚家族七代人的魔幻史诗"),
  b("crime-punishment", "罪与罚 (Crime and Punishment)", "Fyodor Dostoevsky", 1866, ["小说"], ["救赎", "道德"], "一桩谋杀与灵魂审判的心理深渊"),
  b("pride-prejudice", "傲慢与偏见 (Pride and Prejudice)", "Jane Austen", 1813, ["小说"], ["爱情", "婚姻"], "伊丽莎白与达西：偏见消融的爱情经典"),
  b("catcher-rye", "麦田里的守望者 (The Catcher in the Rye)", "J.D. Salinger", 1951, ["小说"], ["青春", "反叛"], "霍尔顿的三天游荡与纯真守望"),
  b("kite-runner", "追风筝的人 (The Kite Runner)", "Khaled Hosseini", 2003, ["小说"], ["救赎", "阿富汗"], "为你千千万万遍：背叛与救赎的故事"),
  b("norwegian-wood", "挪威的森林", "村上春树", 1987, ["小说"], ["青春", "孤独"], "村上春树关于青春、爱与丧失的成名作"),
  b("kafka-shore", "海边的卡夫卡", "村上春树", 2002, ["小说"], ["成长", "宿命"], "十五岁少年离家的双线魔幻成长小说"),
  b("live-yu-hua", "活着", "余华", 1993, ["小说"], ["苦难", "中国"], "福贵一生：在苦难中活着本身即意义"),
  b("wedding-siege", "围城", "钱锺书", 1947, ["小说"], ["讽刺", "婚姻"], "城外的人想进去，城里的人想出来"),
  b("three-body", "三体", "刘慈欣", 2008, ["小说", "科幻"], ["宇宙社会学", "黑暗森林"], "雨果奖：地球文明与三体文明的生死博弈"),
  b("red-chamber", "红楼梦", "曹雪芹", 1791, ["小说"], ["古典", "家族"], "中国古典小说巅峰：大观园的繁华与幻灭"),
  b("little-prince", "小王子 (The Little Prince)", "Antoine de Saint-Exupéry", 1943, ["小说"], ["童话", "纯真"], "本质的东西用眼睛是看不见的"),
  b("old-man-sea", "老人与海 (The Old Man and the Sea)", "Ernest Hemingway", 1952, ["小说"], ["勇气", "尊严"], "人可以被毁灭但不能被打败"),
  b("man-called-ove", "一个叫欧维的男人决定去死 (A Man Called Ove)", "Fredrik Backman", 2012, ["小说"], ["温情", "孤独"], "毒舌老头与邻居们的暖心救赎"),
  b("midnight-library", "午夜图书馆 (The Midnight Library)", "Matt Haig", 2020, ["小说"], ["平行人生", "选择"], "在生与死之间的图书馆试遍人生的可能"),

  // ================= 科幻 / 奇幻 =================
  b("dune", "沙丘 (Dune)", "Frank Herbert", 1965, ["科幻"], ["生态", "权谋"], "香料、沙虫与救世主：科幻史诗之王"),
  b("foundation", "基地 (Foundation)", "Isaac Asimov", 1951, ["科幻"], ["心理史学", "银河帝国"], "以心理史学缩短黑暗时代的银河史诗"),
  b("hitchhikers-guide", "银河系搭车客指南 (The Hitchhiker's Guide to the Galaxy)", "Douglas Adams", 1979, ["科幻"], ["幽默", "荒诞"], "答案是42：科幻喜剧的巅峰"),
  b("enders-game", "安德的游戏 (Ender's Game)", "Orson Scott Card", 1985, ["科幻"], ["战争", "天才少年"], "天才少年在游戏与战争之间的伦理困境"),
  b("martian", "火星救援 (The Martian)", "Andy Weir", 2011, ["科幻"], ["生存", "科学"], "用科学和幽默在火星上种土豆求生"),
  b("project-hail-mary", "挽救计划 (Project Hail Mary)", "Andy Weir", 2021, ["科幻"], ["太空", "友谊"], "失忆宇航员与外星伙伴拯救太阳的硬科幻"),
  b("neuromancer", "神经漫游者 (Neuromancer)", "William Gibson", 1984, ["科幻"], ["赛博朋克"], "赛博空间概念的开山之作"),
  b("left-hand-darkness", "黑暗的左手 (The Left Hand of Darkness)", "Ursula K. Le Guin", 1969, ["科幻"], ["性别", "人类学"], "无性别星球上的信任与人性实验"),
  b("hobbit", "霍比特人 (The Hobbit)", "J.R.R. Tolkien", 1937, ["奇幻"], ["冒险"], "比尔博的意外之旅：中土世界的开端"),
  b("harry-potter-1", "哈利·波特与魔法石 (Harry Potter and the Philosopher's Stone)", "J.K. Rowling", 1997, ["奇幻"], ["魔法", "成长"], "大难不死的男孩踏入霍格沃茨"),

  // ================= 健康 / 生活方式 =================
  b("why-we-sleep", "我们为什么要睡觉 (Why We Sleep)", "Matthew Walker", 2017, ["健康", "科学"], ["睡眠"], "睡眠科学家论睡眠对身心的决定性作用"),
  b("breath-nestor", "呼吸革命 (Breath)", "James Nestor", 2020, ["健康"], ["呼吸法"], "重新学会呼吸：被遗忘的健康开关"),
  b("outlive", "超越百岁 (Outlive)", "Peter Attia", 2023, ["健康"], ["长寿", "医学3.0"], "主动医学视角下的长寿科学与实践"),
  b("how-not-to-die", "救命饮食 (How Not to Die)", "Michael Greger", 2015, ["健康"], ["营养", "植物性饮食"], "用饮食预防和逆转致死性疾病"),
  b("spark-exercise", "运动改造大脑 (Spark)", "John Ratey", 2008, ["健康", "心理学"], ["运动", "大脑"], "运动如何提升学习、情绪与认知"),
  b("in-defense-food", "为食物辩护 (In Defense of Food)", "Michael Pollan", 2008, ["健康"], ["饮食"], "吃食物，别吃太多，以植物为主"),
  b("atomic-attention", "欲罢不能 (Irresistible)", "Adam Alter", 2017, ["健康", "心理学"], ["行为上瘾", "科技"], "行为上瘾的机制与科技产品的钩子"),
  b("digital-minimalism", "数字极简主义 (Digital Minimalism)", "Cal Newport", 2019, ["健康", "个人成长"], ["屏幕时间", "专注"], "重新掌控注意力的数字生活哲学"),

  // ================= 沟通 / 关系 =================
  b("how-win-friends", "人性的弱点 (How to Win Friends and Influence People)", "Dale Carnegie", 1936, ["沟通"], ["人际关系"], "卡内基历久弥新的人际交往法则"),
  b("nonviolent-communication", "非暴力沟通 (Nonviolent Communication)", "Marshall Rosenberg", 1999, ["沟通"], ["同理心", "冲突"], "观察-感受-需要-请求的善意沟通模型"),
  b("crucial-conversations", "关键对话 (Crucial Conversations)", "Kerry Patterson 等", 2002, ["沟通"], ["高风险对话"], "在情绪激烈的关键时刻好好说话"),
  b("difficult-conversations", "高难度谈话 (Difficult Conversations)", "Douglas Stone 等", 1999, ["沟通"], ["冲突处理"], "哈佛谈判项目：拆解每场艰难对话的三层结构"),
  b("five-love-languages", "爱的五种语言 (The 5 Love Languages)", "Gary Chapman", 1992, ["沟通", "关系"], ["亲密关系"], "肯定/陪伴/礼物/服务/身体接触五种爱语"),
  b("hold-me-tight", "抱紧我 (Hold Me Tight)", "Sue Johnson", 2008, ["关系", "心理学"], ["情绪聚焦疗法"], "依恋科学修复伴侣关系的七种对话"),

  // ================= 写作 / 创造力 =================
  b("on-writing", "写作这回事 (On Writing)", "Stephen King", 2000, ["写作", "传记"], ["创作"], "斯蒂芬·金的创作回忆录与写作课"),
  b("bird-by-bird", "关于写作：一只鸟接着一只鸟 (Bird by Bird)", "Anne Lamott", 1994, ["写作"], ["创作心态"], "允许烂初稿：写作与人生的温柔指南"),
  b("war-of-art", "艺术之战 (The War of Art)", "Steven Pressfield", 2002, ["写作", "个人成长"], ["阻力", "创作"], "击败内心阻力，像专业者一样创作"),
  b("big-magic", "大魔法 (Big Magic)", "Elizabeth Gilbert", 2015, ["写作", "个人成长"], ["创意", "恐惧"], "越过恐惧与创意共处的生活方式"),
  b("steal-like-artist", "偷师学艺 (Steal Like an Artist)", "Austin Kleon", 2012, ["写作", "创造力"], ["创意方法"], "没有原创只有组合：10条创意小法则"),
  b("show-your-work", "点子都是偷来的续集：展示你的作品 (Show Your Work!)", "Austin Kleon", 2014, ["创造力"], ["分享", "个人品牌"], "边做边分享，让作品被看见"),
];
