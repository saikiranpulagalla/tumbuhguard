import { demoMeasurements, createDemoSession } from '../src/fixtures/demo';
import { repeatabilityTEM, referenceAgreementTEM, signedMeanDifference } from '../src/domain/calculation';

const session = createDemoSession();
const measurements = demoMeasurements(session);
const active = session.subjects.filter(s => s.status === 'ACTIVE');
if (active.length !== 10) throw new Error(`Expected 10 active subjects, received ${active.length}`);
const traineePairs = active.map(subject => {
  const rows = measurements.filter(m => m.subjectId === subject.id && m.measurerId === session.trainee.id);
  return { subjectId: subject.id, first: rows.find(m => m.round === 1)!.valueCm, second: rows.find(m => m.round === 2)!.valueCm };
});
const referencePairs = active.map(subject => {
  const rows = measurements.filter(m => m.subjectId === subject.id && m.measurerId === session.reference.id);
  return { subjectId: subject.id, first: rows.find(m => m.round === 1)!.valueCm, second: rows.find(m => m.round === 2)!.valueCm };
});
const means = active.map(subject => {
  const t = measurements.filter(m => m.subjectId === subject.id && m.measurerId === session.trainee.id);
  const r = measurements.filter(m => m.subjectId === subject.id && m.measurerId === session.reference.id);
  return { subjectId: subject.id, traineeMean: (t[0]!.valueCm+t[1]!.valueCm)/2, referenceMean: (r[0]!.valueCm+r[1]!.valueCm)/2 };
});
const summary = { traineeTEM: repeatabilityTEM(traineePairs), referenceTEM: repeatabilityTEM(referencePairs), agreementTEM: referenceAgreementTEM(means), signedDifference: signedMeanDifference(means) };
if (!(summary.traineeTEM < 0.6 && summary.referenceTEM < 0.4 && summary.agreementTEM < 0.8)) throw new Error('Demo fixture no longer represents a passing standardization case');
console.log(JSON.stringify(summary, null, 2));
