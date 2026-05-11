import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const Certificate = () => {
  const { tutorialId } = useParams();
  const { user } = useAuth();
  const [tutorial, setTutorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTutorial = async () => {
      setLoading(true);
      try {
        const response = await apiService.getTutorialById(tutorialId);
        setTutorial(response.data);
      } catch (err) {
        console.error('Failed to load certificate tutorial:', err);
        setError(err.message || 'Unable to load certificate');
      } finally {
        setLoading(false);
      }
    };

    loadTutorial();
  }, [tutorialId]);

  const holderName = user?.name || user?.email || 'Student';
  const courseName = tutorial?.title || 'Course';
  const issueDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleDownload = () => {
    window.print();
  }
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-14 w-14 border-b-2 border-orange-500 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 py-12">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }

        @media print {
          body {
            margin: 0;
            padding: 0;
            background: transparent !important;
          }

          body * {
            visibility: hidden !important;
          }

          #certificate-card, #certificate-card * {
            visibility: visible !important;
          }

          #certificate-card {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            min-height: 100vh;
            margin: 0;
            padding: 24mm !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: hidden;
            box-sizing: border-box;
          }

          #certificate-card .print-hidden {
            display: none !important;
          }

          #certificate-card .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="container mx-auto px-2 lg:px-4">
        <div id="certificate-card" className="mx-auto w-full max-w-none rounded-[24px] border border-orange-300 bg-white p-10 shadow-2xl lg:p-12">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-orange-500">ZimCrafts Hub</p>
            <h1 className="mt-4 text-5xl font-bold text-primary-brown">Certificate of Completion</h1>
            <p className="mt-4 text-gray-600">This certificate confirms that the holder has successfully completed the course.</p>
          </div>

          <div className="mt-12 rounded-[30px] border border-orange-100 bg-orange-50 px-10 py-12 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Presented to</p>
            <h2 className="mt-4 text-4xl font-semibold text-primary-brown">{holderName}</h2>
            <p className="mt-2 text-gray-600">for completing the course</p>
            <div className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-lg font-semibold text-orange-700 shadow-sm">
              {courseName}
            </div>

            <div className="mt-10 text-left text-gray-700">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Course type</p>
                <p className="mt-2 text-lg font-medium">{courseName}</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <button
              onClick={handleDownload}
              className="print-hidden rounded-full bg-primary-orange px-8 py-4 text-white transition hover:bg-primary-brown"
            >
              Download as PDF
            </button>
            <div className="text-sm text-gray-500 print-hidden">
              <p>Issued on: {issueDate}</p>
              <p>Powered by ZimCrafts Hub</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
