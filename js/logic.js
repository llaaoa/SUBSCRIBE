// 구독 데이터(subscription) 예시
//{
//  "id": "sub_1",
//  "name": "넷플릭스",
//  "amount": 13500,
//  "cycle": "monthly", //"monthly" 또는 "yearly"//  
//  "nextPaymentDate": "2024-06-15"
//  "category": "영상",
//}

const testData = [
 {name:"네이버 멤버십",  amount:46800, cycle:"yearly",
  nextPaymentDate:"2026-08-16", category:"맴버십", paymentMethod:"신한카드"},
 {name:"스포티파이",amount:10900, cycle:"monthly",
  nextPaymentDate:"2026-08-20", category:"음악", paymentMethod:"우리카드"},
 {name:"헬스장",    amount:42000, cycle:"monthly",
  nextPaymentDate:"2026-09-01", category:"운동", paymentMethod:"신한카드"},
 {name:"AI",  amount:15000, cycle:"monthly",
  nextPaymentDate:"2027-02-01", category:"생산성", paymentMethod:"국민카드"}
];

// 구독 1건을 받아 월 기준 금액으로 환산해 반환한다.
// cycle이 "yearly"면 12로 나누고, 원 단위로 반올림한다.
function getMonthlyAmount(subscription) {
    if (subscription.cycle === "yearly") {
        return Math.round(subscription.amount / 12);
    }
    return subscription.amount;
}

// 구독 데이터 배열을 받아 월 기준 금액으로 환산한 총합을 반환한다.
function getTotalMonthlyAmount(subscriptions) {
    let total = 0;
    for (const subscription of subscriptions) {
        total += getMonthlyAmount(subscription);
    }   
    return total;
}   

