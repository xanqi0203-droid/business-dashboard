// 业务大类常量（与沉淀表「业务」列对齐，共 7 类）
export const BUSINESS_CATEGORIES = [
  { value: 'mobile',  label: '手机银行促活' },
  { value: 'asset',   label: '资产提升' },
  { value: 'payment', label: '快捷支付' },
  { value: 'digital', label: '数字人民币' },
  { value: 'loan',    label: '贷款营销' },
  { value: 'card',    label: '信用卡' },
  { value: 'wealth',  label: '理财营销' }
];

export const BUSINESS_LABEL = Object.fromEntries(
  BUSINESS_CATEGORIES.map(c => [c.value, c.label])
);

// 历史沉淀客筛规则 48 条
export const SEGMENT_RULES = [
  // 手机银行促活 1-12
  { id: 1,  business: 'mobile', group: '低频',       rule: '1.有手机银行；2.近12个月登录过手机银行，次数不论，近6个月尚未登录；3.去除黑名单；4.姓名三位数以内，去除英文；5.去除30天内智能/人工外呼；6.去除本月自然月活客户', connRate: 50.9, intentRate: 10.7 },
  { id: 2,  business: 'mobile', group: '中频',       rule: '1.有手机银行；2.近12个月登陆1-4月份；3.去除黑名单；4.姓名三位数以内，去除英文5.去除30天内智能/人工外呼；6.去除本月自然月活客户', connRate: 53.0, intentRate: 8.8 },
  { id: 3,  business: 'mobile', group: '高频',       rule: '1.有手机银行；2.近6个月登陆过5-6月份；3.去除黑名单；4.姓名三位数以内，去除英文5.去除30天内智能/人工外呼；6.去除本月自然月活客户', connRate: 50.2, intentRate: 10.6 },
  { id: 4,  business: 'mobile', group: '高潜客户',   rule: '1.当前有手机银行 2.年龄18-60 3.本月未活 4.上月月均资产余额10元-20万元 5.近三个月内外呼过且表示有意向的客户', connRate: 50.2, intentRate: 7.1 },
  { id: 5,  business: 'mobile', group: '生活类权益客群', rule: '1.有爱奇艺、网易云音乐、哔哩哔哩、喜马拉雅、优酷、唯品会、来伊份、全面时代、咖啡券等等消费需求或历史有相关消费记录或当前手机银行配套相应权益', connRate: 45.2, intentRate: 6.3 },
  { id: 6,  business: 'mobile', group: '话费充值客群', rule: '1.当前有手机银行 2.年龄18-60 3.本月未活 4.上月月均资产余额10元-20万元 5.客户在其他平台有话费充值记录，当月手机银行未登录', connRate: 49.8, intentRate: 16.2 },
  { id: 7,  business: 'mobile', group: '睡眠客群',   rule: '1.有手机银行；2.12个月以上未登录；3.去除黑名单；4.姓名三位数以内，去除英文；5.去除30天内智能/人工外呼；6.去除本月自然月活客户', connRate: 47.0, intentRate: 7.9 },
  { id: 8,  business: 'mobile', group: '瞌睡客群',   rule: '1.有手机银行；2.近9个月没有登录，但12个月有登录过；3.去除黑名单；4.姓名三位数以内，去除英文；5.去除30天内智能/人工外呼；6.去除本月自然月活客户', connRate: 43.0, intentRate: 7.1 },
  { id: 9,  business: 'mobile', group: '摇摆C客群',  rule: '1.有手机银行；2.近3月没有登录，但9个月内有登录过；3.去除黑名单；4.姓名三位数以内，去除英文；5.去除30天内智能/人工外呼；6.去除本月自然月活客户', connRate: 50.7, intentRate: 6.8 },
  { id: 10, business: 'mobile', group: '摇摆B客群',  rule: '1.有手机银行；2.近3月登录3次1次；3.去除黑名单；4.姓名三位数以内，去除英文；5.去除30天内智能/人工外呼；6.去除本月自然月活客户', connRate: 58.5, intentRate: 8.5 },
  { id: 11, business: 'mobile', group: '摇摆A客群',  rule: '1.有手机银行；2.近3月登录3次2次；3.去除黑名单；4.姓名三位数以内，去除英文；5.去除30天内智能/人工外呼；6.去除本月自然月活客户', connRate: 56.3, intentRate: 9.9 },
  { id: 12, business: 'mobile', group: '铁盘客群',   rule: '1.有手机银行；2.近3月登录3次3次；3.去除黑名单；4.姓名三位数以内，去除英文；5.去除30天内智能/人工外呼；6.去除本月自然月活客户', connRate: 51.2, intentRate: 10.2 },

  // 资产提升 13-23
  { id: 13, business: 'asset',  group: '稳定高代发转账流失', rule: '1.30-50岁；2.优势企事业代发客户；3.每月有大于3000/4000/5000元的固定转账', connRate: 50.0, intentRate: 7.7 },
  { id: 14, business: 'asset',  group: '不稳定代发消费流失', rule: '1.35岁以下；2.在职代发；3.每月有大于3000/4000/5000元的固定消费流失', connRate: 46.8, intentRate: 4.9 },
  { id: 15, business: 'asset',  group: '稳定低代发',         rule: '1.18-70岁；2.手机银行近三个月登录过；3.上月末和上月资产均在1000以下', connRate: 49.4, intentRate: 5.9 },
  { id: 16, business: 'asset',  group: '养老代发',           rule: '1.50-70岁；2.每月固定时间有固定资金流入；3.每月有固定转账', connRate: 61.0, intentRate: 28.1 },
  { id: 17, business: 'asset',  group: '高代发资产提升',     rule: '1.18-70岁；2.手机银行近三个月登录过；3.金融资产小于20万；4.当月代发薪金额大于3000', connRate: 56.1, intentRate: 16.6 },
  { id: 18, business: 'asset',  group: '代发理财',           rule: '1.30-50岁；2.优势企事业代发客户；3.当月代发薪金额大于3000；4.有购买过本行内理财产品', connRate: 50.7, intentRate: 12.4 },
  { id: 19, business: 'asset',  group: '临界客群',           rule: '1.手机银行近三个月登陆过；2.金融资产小于等于20万；3.年龄小于等于70岁；4.上月末资产临近1万/5万/10万/15万/20万/40万', connRate: 46.5, intentRate: 5.5 },
  { id: 20, business: 'asset',  group: '同名跨行转账',       rule: '1.手机银行近三个月登陆过；2.金融资产小于等于20万；3.年龄小于等于70岁；4.近三个月每月转出大于等于2000元', connRate: 45.4, intentRate: 13.6 },
  { id: 21, business: 'asset',  group: '高余额宝',           rule: '1.手机银行近三个月登陆过；2.金融资产小于等于20万；3.年龄小于等于70岁；4.转入三个月内总交易金额大于等于3000元；5.提高一个月内总交易金额大于等于1000元（交易金额规则可视情况产生灵活调整）', connRate: 47.6, intentRate: 15.7 },
  { id: 22, business: 'asset',  group: '下降促回存',         rule: '1.上月已晋级客户；2.当前资产有所下降', connRate: 45.3, intentRate: 9.1 },
  { id: 23, business: 'asset',  group: '低资产',             rule: '1.十四日留存户；2.近三个月日均和月末时点金额均在100元以下的低资产客群', connRate: 44.5, intentRate: 6.4 },

  // 快捷支付 24-28
  { id: 24, business: 'payment', group: '手机活跃中频客群',   rule: '1.近半年登录手机银行月份1-6；2.本月未活；3.去除资产为零的客户', connRate: 64.7, intentRate: 8.2 },
  { id: 25, business: 'payment', group: '快捷支付客群',       rule: '快捷支付近1月交易金额大于1k且交易金额大于2k（非老客），和当前未报名活动客户，筛选当月交易金额为800，未活客户', connRate: 45.27, intentRate: 4.2 },
  { id: 26, business: 'payment', group: '权益客户',           rule: '1.年龄大于18小于70；2.已签约手机银行；3.近三月手机银行未活跃；4.发活动券自未领取', connRate: 59.0, intentRate: 6.1 },
  { id: 27, business: 'payment', group: '代发近3个月有活跃客群', rule: '1.代发近三月至一个月活跃客户；2.本月已登录手机银行', connRate: 58.5, intentRate: 28.2 },
  { id: 28, business: 'payment', group: '高价值客群',         rule: '1.代发超8000；2.近三月月银行卡转账超10000；3.近三月有过快捷交易记录', connRate: 53.1, intentRate: 9.4 },

  // 数字人民币 29-32
  { id: 29, business: 'digital', group: '未开通数币',         rule: '1.开通手机银行；2.从未开立数币钱包个人客户', connRate: 49.0, intentRate: 12.0 },
  { id: 30, business: 'digital', group: '数币权益客户',       rule: '1.数币立减16元客群；2.从未立即数币钱包个人客户', connRate: 42.9, intentRate: 6.0 },
  { id: 31, business: 'digital', group: '代发未开通数币',     rule: '1.代发企业且没有开通数币钱包的客户；2.手机银行活跃且没有开通数币钱包；3.年龄小于60岁的代发客户', connRate: 74.4, intentRate: 4.0 },
  { id: 32, business: 'digital', group: '资产500+客群',       rule: '1.年龄在18-65；2.月日均资产500-100万；3.近三个月登录过手机银行；4.未开通数币钱包', connRate: 56.7, intentRate: 6.0 },

  // 贷款营销 33-34
  { id: 33, business: 'loan',    group: '房贷客群',           rule: '1.手机银行近六个月登录过；2.月日均资产小于20w；3.18-60周岁，有房贷未结清；4.近一个月快捷支付消费额大于3000', connRate: 46.2, intentRate: 6.1 },
  { id: 34, business: 'loan',    group: '装修贷客群',         rule: '1.18-60岁；2.一手房二手房客群；3.贷款余额50万以上客群；4.贷款发放在2021年3月到2022年3月（一手房）；5.2022年9月到2022年末（二手房）', connRate: 49.8, intentRate: 7.3 },

  // 信用卡 35-46
  { id: 35, business: 'card',    group: '账单分期营销-普通卡', rule: '1.全量信用卡分期；2.分期3000元以上，有历史分期的普通卡群', connRate: 45.8, intentRate: 6.0 },
  { id: 36, business: 'card',    group: '汽车卡客群',         rule: '持有汽车卡的ETC客户', connRate: 65.49, intentRate: 18.82 },
  { id: 37, business: 'card',    group: '睡眠客群',           rule: '高流失倾向和已激活睡眠3-6个月客户', connRate: 59.89, intentRate: 14.57 },
  { id: 38, business: 'card',    group: '睡眠客群',           rule: '睡眠6-18个月客群', connRate: 59.62, intentRate: 15.28 },
  { id: 39, business: 'card',    group: '睡眠客群',           rule: '未激活睡眠 3-6个月，6-18个月，18个月以上或从未交易', connRate: 62.20, intentRate: 14.78 },
  { id: 40, business: 'card',    group: '睡眠客群',           rule: '已激活睡眠 3-6个月，有高流失倾向', connRate: 67.16, intentRate: 26.55 },
  { id: 41, business: 'card',    group: '睡眠客群',           rule: '已激活睡眠 6-18个月，18个月以上', connRate: 65.49, intentRate: 21.82 },
  { id: 42, business: 'card',    group: '未活跃客户',         rule: '今年新客户未活跃', connRate: 62.69, intentRate: 8.48 },
  { id: 43, business: 'card',    group: '新开卡，未用卡',     rule: '信用卡新户未活跃', connRate: 50.59, intentRate: 11.23 },
  { id: 44, business: 'card',    group: '信用卡，高消费',     rule: '借记卡高消费客群', connRate: 52.52, intentRate: 8.22 },
  { id: 45, business: 'card',    group: '信用卡，消费降级',   rule: '信用卡消费和消费降级客户', connRate: 43.44, intentRate: 20.40 },
  { id: 46, business: 'card',    group: '全量促活（促激取）', rule: '1.客户提供；2.客户卡状态正常；3.已激活使用但最近6个月未使用失活/未激活（未领立减金）', connRate: 45.80, intentRate: 1.20 },

  // 理财营销 47-48
  { id: 47, business: 'wealth',  group: '到期客群',           rule: '1.2025年1月以后；2.理财产品到期客群', connRate: 56.10, intentRate: 12.10 },
  { id: 48, business: 'wealth',  group: '自营现金管理',       rule: '1.已完成理财签约；2.上日理财余额为0', connRate: 0, intentRate: 0 }
];
