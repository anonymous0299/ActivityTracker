import { Plus } from 'lucide-react';

const TodoTasks = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Task Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize work milestones, categories, and AI-suggested milestones.
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all duration-300">
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      <div className="premium-card p-6 rounded-2xl">
        <div className="text-center py-12 text-slate-500 text-xs">
          No tasks created yet. Create a task above.
        </div>
      </div>
    </div>
  );
};

export default TodoTasks;
