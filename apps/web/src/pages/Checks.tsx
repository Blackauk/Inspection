import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { addToQueue } from '../utils/offlineQueue';
import { useOffline } from '../contexts/OfflineContext';

interface Occurrence {
  id: string;
  dueDate: string;
  schedule: {
    name: string;
    asset: { code: string; name: string };
    checkTemplate: {
      name: string;
      questions: Array<{
        id: string;
        question: string;
        type: string;
        required: boolean;
      }>;
    };
  };
}

export default function Checks() {
  const { isOnline } = useOffline();
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOccurrences();
  }, []);

  async function loadOccurrences() {
    try {
      const data = await api.get<Occurrence[]>('/check-occurrences/due?days=7');
      setOccurrences(data);
    } catch (error) {
      console.error('Failed to load occurrences:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOccurrence) return;

    setSubmitting(true);
    try {
      const submissionData = {
        occurrenceId: selectedOccurrence.id,
        answers: selectedOccurrence.schedule.checkTemplate.questions.map((q) => ({
          questionId: q.id,
          answer: answers[q.id],
          comment: answers[`${q.id}_comment`],
        })),
      };

      if (isOnline) {
        await api.post('/check-submissions', submissionData);
        await loadOccurrences();
        setSelectedOccurrence(null);
        setAnswers({});
      } else {
        await addToQueue('submitCheck', submissionData);
        await loadOccurrences();
        setSelectedOccurrence(null);
        setAnswers({});
        alert('Check saved offline. It will sync when you are back online.');
      }
    } catch (error) {
      console.error('Failed to submit check:', error);
      alert('Failed to submit check');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (selectedOccurrence) {
    return (
      <div>
        <button
          onClick={() => setSelectedOccurrence(null)}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to list
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {selectedOccurrence.schedule.checkTemplate.name}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Asset: {selectedOccurrence.schedule.asset.code} -{' '}
              {selectedOccurrence.schedule.asset.name}
            </p>
            <p className="text-sm text-gray-600">
              Due: {new Date(selectedOccurrence.dueDate).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-4">
            {selectedOccurrence.schedule.checkTemplate.questions.map((question) => (
              <div key={question.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {question.question}
                  {question.required && <span className="text-red-500">*</span>}
                </label>
                {question.type === 'YesNo' && (
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    value={answers[question.id] || ''}
                    onChange={(e) =>
                      setAnswers({ ...answers, [question.id]: e.target.value === 'true' })
                    }
                    required={question.required}
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                )}
                {question.type === 'Number' && (
                  <input
                    type="number"
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    value={answers[question.id] || ''}
                    onChange={(e) =>
                      setAnswers({ ...answers, [question.id]: Number(e.target.value) })
                    }
                    required={question.required}
                  />
                )}
                {question.type === 'Text' && (
                  <textarea
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    value={answers[question.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                    required={question.required}
                  />
                )}
                <textarea
                  className="mt-2 border border-gray-300 rounded-md px-3 py-2 w-full text-sm"
                  placeholder="Comment (optional)"
                  value={answers[`${question.id}_comment`] || ''}
                  onChange={(e) =>
                    setAnswers({ ...answers, [`${question.id}_comment`]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Check'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Due Checks</h1>

      <div className="bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {occurrences.map((occ) => {
              const isOverdue = new Date(occ.dueDate) < new Date();
              return (
                <tr key={occ.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                      {new Date(occ.dueDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{occ.schedule.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {occ.schedule.asset.code} - {occ.schedule.asset.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedOccurrence(occ)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Complete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


