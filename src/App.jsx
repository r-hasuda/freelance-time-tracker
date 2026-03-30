import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, Trash2, AlertTriangle, Clock, DollarSign, Plus, Briefcase } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'freelance-time-tracker';

export default function App() {
  const [tasks, setTasks] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse tasks from localStorage", e);
        }
      }
    }
    return [];
  });

  const [newTaskName, setNewTaskName] = useState('');
  const [newReward, setNewReward] = useState('');
  const [alertTimeActive, setAlertTimeActive] = useState(false);
  const [alertTimeThreshold, setAlertTimeThreshold] = useState(30);
  const [alertWageActive, setAlertWageActive] = useState(false);
  const [alertWageThreshold, setAlertWageThreshold] = useState(1500);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      setTasks(currentTasks =>
        currentTasks.map(task => {
          if (!task.isCompleted && (task.isMainRunning || task.isExtraRunning)) {
            const lastUpdated = task.lastUpdated || now;
            const deltaSeconds = Math.floor((now - lastUpdated) / 1000);
            
            if (deltaSeconds > 0) {
              return {
                ...task,
                mainTime: task.isMainRunning ? task.mainTime + deltaSeconds : task.mainTime,
                extraTime: task.isExtraRunning ? task.extraTime + deltaSeconds : task.extraTime,
                lastUpdated: lastUpdated + (deltaSeconds * 1000)
              };
            }
          }
          return task;
        })
      );
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskName.trim() || !newReward) return;

    const newTask = {
      id: Date.now().toString(),
      name: newTaskName,
      reward: Number(newReward),
      mainTime: 0,
      extraTime: 0,
      isMainRunning: false,
      isExtraRunning: false,
      isCompleted: false,
      lastUpdated: Date.now(),
      alerts: {
        time: { active: alertTimeActive, threshold: alertTimeThreshold },
        wage: { active: alertWageActive, threshold: alertWageThreshold }
      }
    };

    setTasks([...tasks, newTask]);
    setNewTaskName('');
    setNewReward('');
    setAlertTimeActive(false);
    setAlertWageActive(false);
    setAlertTimeThreshold(30);
    setAlertWageThreshold(1500);
  };

  const toggleTimer = (taskId, timerType) => {
    setTasks(currentTasks =>
      currentTasks.map(task => {
        if (task.id === taskId) {
          const now = Date.now();
          if (timerType === 'main') {
            const willRun = !task.isMainRunning;
            return {
              ...task,
              isMainRunning: willRun,
              isExtraRunning: willRun ? false : task.isExtraRunning,
              lastUpdated: willRun ? now : task.lastUpdated
            };
          } else {
            const willRun = !task.isExtraRunning;
            return {
              ...task,
              isExtraRunning: willRun,
              isMainRunning: willRun ? false : task.isMainRunning,
              lastUpdated: willRun ? now : task.lastUpdated
            };
          }
        }
        return task;
      })
    );
  };

  const completeTask = (taskId) => {
    if (window.confirm('この案件を完了としますか？')) {
      setTasks(currentTasks =>
        currentTasks.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              isCompleted: true,
              isMainRunning: false,
              isExtraRunning: false
            };
          }
          return task;
        })
      );
    }
  };

  const deleteTask = (taskId) => {
    if (window.confirm('本当にこの案件を削除しますか？\n（この操作は取り消せません）')) {
      setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateWage = (reward, main, extra) => {
    const total = main + extra;
    // 作業時間が5分(300秒)未満の場合、時給が極端な値（例:何十万円）になるのを防ぐためnullを返す
    if (total < 300) return null;
    return Math.floor(reward / (total / 3600));
  };

  const activeTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center md:justify-start gap-2">
            <Clock className="w-8 h-8 text-indigo-600" />
            在宅副業タイムトラッカー
          </h1>
          <p className="text-gray-500 mt-2">スコープクリープを防ぎ、あなたの「本当の時給」を可視化します。</p>
        </header>

        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 mb-10">
          <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Plus className="w-6 h-6 text-indigo-600" /> 新規案件の登録
          </h2>
          <form onSubmit={handleAddTask}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  案件名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTaskName}
                  onChange={e => setNewTaskName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                  placeholder="例: ブログ記事執筆"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  予定報酬額（円） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newReward}
                  onChange={e => setNewReward(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                  placeholder="例: 5000"
                />
              </div>
            </div>

            <div className="bg-indigo-50/50 p-4 md:p-5 rounded-xl border border-indigo-100 mb-6">
              <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> 単価交渉のためのアラート設定（任意）
              </h3>
              <div className="flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertTimeActive}
                    onChange={e => setAlertTimeActive(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <div className="text-sm text-gray-700 flex flex-wrap items-center gap-2">
                    <span>予定外作業が</span>
                    <input
                      type="number"
                      min="1"
                      value={alertTimeThreshold}
                      onChange={e => setAlertTimeThreshold(Number(e.target.value))}
                      disabled={!alertTimeActive}
                      className="w-20 px-2 py-1 bg-white text-gray-900 border border-gray-300 rounded text-center disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-500 outline-none focus:border-indigo-500"
                    />
                    <span>分を超えたら警告</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertWageActive}
                    onChange={e => setAlertWageActive(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <div className="text-sm text-gray-700 flex flex-wrap items-center gap-2">
                    <span>実質時給が</span>
                    <input
                      type="number"
                      min="1"
                      step="100"
                      value={alertWageThreshold}
                      onChange={e => setAlertWageThreshold(Number(e.target.value))}
                      disabled={!alertWageActive}
                      className="w-24 px-2 py-1 bg-white text-gray-900 border border-gray-300 rounded text-center disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-500 outline-none focus:border-indigo-500"
                    />
                    <span>円を下回ったら警告</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" /> 案件を追加する
            </button>
          </form>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-gray-600" /> 進行中の案件 ({activeTasks.length})
          </h2>
          
          {activeTasks.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
              進行中の案件はありません。上のフォームから新しい案件を追加してください。
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {activeTasks.map(task => {
                const totalSeconds = task.mainTime + task.extraTime;
                const currentWage = calculateWage(task.reward, task.mainTime, task.extraTime);
                
                const timeAlertTriggered = task.alerts.time.active && (task.extraTime / 60) >= task.alerts.time.threshold;
                const wageAlertTriggered = task.alerts.wage.active && currentWage !== null && currentWage < task.alerts.wage.threshold;

                return (
                  <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{task.name}</h3>
                        <p className="text-gray-500 font-medium flex items-center gap-1">
                          <DollarSign className="w-4 h-4" /> 予定報酬: {task.reward.toLocaleString()} 円
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 md:min-w-[200px] text-center">
                        <p className="text-sm font-semibold text-gray-500 mb-1">現在の実質時給</p>
                        <p className={`font-mono text-3xl font-bold ${wageAlertTriggered ? 'text-red-600' : 'text-gray-800'}`}>
                          {currentWage === null ? '---' : `¥${currentWage.toLocaleString()}`}
                        </p>
                      </div>
                    </div>

                    {(timeAlertTriggered || wageAlertTriggered) && (
                      <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex flex-col gap-2">
                        {timeAlertTriggered && (
                          <div className="flex items-start gap-2 text-red-700 font-medium text-sm md:text-base">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>予定外作業時間が設定ライン（{task.alerts.time.threshold}分）を超過しています！スコープクリープの恐れがあります。</p>
                          </div>
                        )}
                        {wageAlertTriggered && (
                          <div className="flex items-start gap-2 text-red-700 font-medium text-sm md:text-base">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>実質時給が設定ライン（{task.alerts.wage.threshold}円）を下回りました！単価交渉を検討してください。</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-6 md:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-5 rounded-xl border-2 transition-all ${task.isMainRunning ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-gray-700 flex items-center gap-2">
                              <Clock className={`w-5 h-5 ${task.isMainRunning ? 'text-indigo-600' : 'text-gray-400'}`} /> 通常作業
                            </span>
                            <span className={`font-mono text-2xl font-bold tracking-wider ${task.isMainRunning ? 'text-indigo-700' : 'text-gray-700'}`}>
                              {formatTime(task.mainTime)}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleTimer(task.id, 'main')}
                            className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors ${
                              task.isMainRunning 
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' 
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {task.isMainRunning ? <><Pause className="w-5 h-5" /> 一時停止</> : <><Play className="w-5 h-5" /> スタート</>}
                          </button>
                        </div>

                        <div className={`p-5 rounded-xl border-2 transition-all ${task.isExtraRunning ? 'border-orange-500 bg-orange-50 ring-4 ring-orange-500/10' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-gray-700 flex items-center gap-2">
                              <AlertTriangle className={`w-5 h-5 ${task.isExtraRunning ? 'text-orange-600' : 'text-gray-400'}`} /> 予定外・追加
                            </span>
                            <span className={`font-mono text-2xl font-bold tracking-wider ${task.isExtraRunning ? 'text-orange-700' : 'text-gray-700'}`}>
                              {formatTime(task.extraTime)}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleTimer(task.id, 'extra')}
                            className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors ${
                              task.isExtraRunning 
                                ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-md' 
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {task.isExtraRunning ? <><Pause className="w-5 h-5" /> 一時停止</> : <><Play className="w-5 h-5" /> スタート</>}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> 削除
                      </button>
                      <button
                        onClick={() => completeTask(task.id)}
                        className="px-4 py-2 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" /> 完了とする
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {completedTasks.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Check className="w-6 h-6 text-green-600" /> 完了済みの案件 ({completedTasks.length})
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-3 px-4 text-sm font-bold text-gray-600">案件名</th>
                      <th className="py-3 px-4 text-sm font-bold text-gray-600">報酬額</th>
                      <th className="py-3 px-4 text-sm font-bold text-gray-600">総作業時間</th>
                      <th className="py-3 px-4 text-sm font-bold text-gray-600">最終実質時給</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedTasks.map(task => {
                      const totalSeconds = task.mainTime + task.extraTime;
                      const finalWage = calculateWage(task.reward, task.mainTime, task.extraTime);
                      return (
                        <tr key={task.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{task.name}</td>
                          <td className="py-3 px-4 text-gray-600">¥{task.reward.toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono text-gray-600">{formatTime(totalSeconds)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-gray-900">
                            {finalWage === null ? '---' : `¥${finalWage.toLocaleString()}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
