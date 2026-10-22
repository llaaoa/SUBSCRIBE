(function () {
  const categoryColors = ["#176b58", "#e9785b", "#d0a42e", "#5482a3", "#8c6d91", "#59968a"];

  function formatWon(amount) {
    return `${Math.round(amount).toLocaleString("ko-KR")}원`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function renderSummary(monthlyTotal, annualTotal, weeklyTotal, dueCount) {
    document.getElementById("monthly-total").textContent = formatWon(monthlyTotal);
    document.getElementById("yearly-total").textContent = formatWon(annualTotal);
    document.getElementById("weekly-total").textContent = formatWon(weeklyTotal);
    document.getElementById("weekly-caption").textContent = `이번 주 예정 결제 ${dueCount}건`;
  }

  function renderSubscriptions(subscriptions) {
    const list = document.getElementById("subscription-list");
    document.getElementById("subscription-count").textContent = subscriptions.length;

    if (subscriptions.length === 0) {
      list.innerHTML = '<div class="empty-state"><strong>아직 등록된 구독이 없어요.</strong><p>오른쪽 폼에서 첫 구독을 추가해 보세요.</p></div>';
      return;
    }

    list.innerHTML = subscriptions.map(function (subscription) {
      const dueClass = subscription.daysUntil <= 3 ? "due-label due-soon" : "due-label";
      const dateLabel = `${subscription.dueMonth}월 ${subscription.dueDay}일`;
      const dayLabel = subscription.daysUntil === 0 ? "오늘 결제" : `D-${subscription.daysUntil}`;
      const cycleLabel = subscription.cycle === "yearly" ? "연간" : "월간";
      const paymentMethod = subscription.paymentMethod ? ` · ${escapeHtml(subscription.paymentMethod)}` : "";

      return `<article class="subscription-card">
        <div class="service-main">
          <div class="service-name-row"><span class="service-name">${escapeHtml(subscription.name)}</span><span class="category-tag">${escapeHtml(subscription.category || "기타")}</span></div>
          <p class="service-meta">${cycleLabel} 결제${paymentMethod}</p>
        </div>
        <div class="service-amount">${formatWon(subscription.amount)}<small>/${cycleLabel === "연간" ? "년" : "월"}</small></div>
        <div class="card-bottom">
          <span class="${dueClass}">${dateLabel} <strong>${dayLabel}</strong></span>
          <div class="card-actions">
            <button class="text-button" type="button" data-action="edit" data-id="${escapeHtml(subscription.id)}" aria-label="${escapeHtml(subscription.name)} 수정">수정</button>
            <button class="text-button delete" type="button" data-action="delete" data-id="${escapeHtml(subscription.id)}" aria-label="${escapeHtml(subscription.name)} 삭제">삭제</button>
          </div>
        </div>
      </article>`;
    }).join("");
  }

  function renderCategories(categories) {
    const container = document.getElementById("category-breakdown");
    if (categories.length === 0) {
      container.innerHTML = '<div class="empty-state"><strong>표시할 지출이 없습니다.</strong><p>구독을 추가하면 비중을 볼 수 있어요.</p></div>';
      return;
    }

    container.innerHTML = categories.map(function (category, index) {
      const color = categoryColors[index % categoryColors.length];
      return `<div class="category-row">
        <span class="category-name" title="${escapeHtml(category.name)}">${escapeHtml(category.name)}</span>
        <div class="category-track" role="img" aria-label="${escapeHtml(category.name)} ${category.percent}%"><div class="category-bar" style="width: ${category.percent}%; background: ${color}"></div></div>
        <span class="category-amount">${formatWon(category.amount)}<span class="category-percent">${category.percent}%</span></span>
      </div>`;
    }).join("");
  }

  window.SubscriptionUI = {
    formatWon: formatWon,
    renderSummary: renderSummary,
    renderSubscriptions: renderSubscriptions,
    renderCategories: renderCategories
  };
})();
