(function () {
  const storageKey = "subscription-tracker-data-v1";
  const form = document.getElementById("subscription-form");
  const cancelButton = document.getElementById("cancel-edit");
  const submitButton = document.getElementById("submit-button");
  const formTitle = document.getElementById("form-title");
  const list = document.getElementById("subscription-list");
  const status = document.getElementById("app-status");
  let editingId = null;
  let subscriptions = loadSubscriptions();

  function loadSubscriptions() {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter(isValidSubscription) : [];
    } catch (error) {
      return [];
    }
  }

  function isValidSubscription(item) {
    return item && typeof item === "object" && typeof item.name === "string" && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 && (item.cycle === "monthly" || item.cycle === "yearly") && typeof item.nextPaymentDate === "string";
  }

  function saveSubscriptions() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(subscriptions));
      return true;
    } catch (error) {
      announce("저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.");
      return false;
    }
  }

  function localDate(year, month, day) {
    return new Date(year, month, day);
  }

  function parseDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const date = localDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return null;
    return date;
  }

  function dateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function getNextPaymentDate(subscription, today) {
    const initialDate = parseDate(subscription.nextPaymentDate);
    if (!initialDate) return null;
    const dueDate = new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate());
    const originalDay = initialDate.getDate();

    while (dueDate < today) {
      const targetYear = dueDate.getFullYear() + (subscription.cycle === "yearly" ? 1 : 0);
      const targetMonth = dueDate.getMonth() + (subscription.cycle === "monthly" ? 1 : 0);
      dueDate.setDate(1);
      dueDate.setFullYear(targetYear);
      dueDate.setMonth(targetMonth);
      const lastDay = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
      dueDate.setDate(Math.min(originalDay, lastDay));
    }
    return dueDate;
  }

  function getToday() {
    const now = new Date();
    return localDate(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function getDaysBetween(start, end) {
    return Math.round((end.getTime() - start.getTime()) / 86400000);
  }

  function getWeekStart(today) {
    const start = new Date(today);
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
    return start;
  }

  function getViewSubscriptions(today) {
    return subscriptions.map(function (subscription) {
      const dueDate = getNextPaymentDate(subscription, today);
      if (!dueDate) return null;
      return Object.assign({}, subscription, {
        dueMonth: dueDate.getMonth() + 1,
        dueDay: dueDate.getDate(),
        daysUntil: getDaysBetween(today, dueDate)
      });
    }).filter(Boolean);
  }

  function render() {
    const today = getToday();
    const weekStart = getWeekStart(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const visibleSubscriptions = getViewSubscriptions(today);
    const monthlyTotal = getTotalMonthlyAmount(subscriptions);
    let weeklyTotal = 0;
    let dueCount = 0;
    const categoryTotals = new Map();

    visibleSubscriptions.forEach(function (subscription) {
      const dueDate = localDate(today.getFullYear(), subscription.dueMonth - 1, subscription.dueDay);
      if (dueDate >= weekStart && dueDate < weekEnd) {
        weeklyTotal += Number(subscription.amount);
        dueCount += 1;
      }
      const category = subscription.category || "기타";
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + getMonthlyAmount(subscription));
    });

    const categories = Array.from(categoryTotals, function (entry) {
      return { name: entry[0], amount: entry[1] };
    }).sort(function (a, b) { return b.amount - a.amount; });
    categories.forEach(function (category) {
      category.percent = monthlyTotal === 0 ? 0 : Math.round(category.amount / monthlyTotal * 100);
    });

    SubscriptionUI.renderSummary(monthlyTotal, monthlyTotal * 12, weeklyTotal, dueCount);
    SubscriptionUI.renderSubscriptions(visibleSubscriptions);
    SubscriptionUI.renderCategories(categories);
  }

  function announce(message) {
    status.textContent = "";
    window.setTimeout(function () { status.textContent = message; }, 0);
  }

  function resetForm() {
    editingId = null;
    form.reset();
    document.getElementById("category").value = "기타";
    document.getElementById("next-payment-date").value = dateString(getToday());
    formTitle.textContent = "새 구독 추가";
    submitButton.innerHTML = '<span aria-hidden="true">＋</span> 구독 추가';
    cancelButton.hidden = true;
  }

  function startEditing(subscription) {
    editingId = subscription.id;
    document.getElementById("name").value = subscription.name;
    document.getElementById("amount").value = subscription.amount;
    document.getElementById("cycle").value = subscription.cycle;
    document.getElementById("next-payment-date").value = subscription.nextPaymentDate;
    document.getElementById("category").value = subscription.category || "기타";
    document.getElementById("payment-method").value = subscription.paymentMethod || "";
    formTitle.textContent = "구독 수정";
    submitButton.textContent = "변경 저장";
    cancelButton.hidden = false;
    document.getElementById("name").focus();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const existing = subscriptions.find(function (subscription) { return subscription.id === editingId; });
    const subscription = {
      id: existing ? existing.id : `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: String(formData.get("name")).trim(),
      amount: Number(formData.get("amount")),
      cycle: String(formData.get("cycle")),
      nextPaymentDate: String(formData.get("nextPaymentDate")),
      category: String(formData.get("category")).trim() || "기타",
      paymentMethod: String(formData.get("paymentMethod")).trim()
    };

    if (existing) {
      subscriptions = subscriptions.map(function (item) { return item.id === editingId ? subscription : item; });
    } else {
      subscriptions.push(subscription);
    }
    if (!saveSubscriptions()) return;
    resetForm();
    render();
    announce(existing ? "구독 정보를 수정했습니다." : "구독을 추가했습니다.");
  });

  list.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const subscription = subscriptions.find(function (item) { return item.id === button.dataset.id; });
    if (!subscription) return;

    if (button.dataset.action === "edit") {
      startEditing(subscription);
      return;
    }
    if (button.dataset.action === "delete" && window.confirm(`'${subscription.name}' 구독을 삭제할까요?`)) {
      subscriptions = subscriptions.filter(function (item) { return item.id !== subscription.id; });
      if (saveSubscriptions()) {
        render();
        if (editingId === subscription.id) resetForm();
        announce("구독을 삭제했습니다.");
      }
    }
  });

  cancelButton.addEventListener("click", resetForm);
  document.getElementById("next-payment-date").value = dateString(getToday());
  render();
})();
