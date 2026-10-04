interface LegalPageProps {
  slug: string
  managedContent: { title: string; body: string } | null
  contactEmail: string
}

export function LegalPage({ slug, managedContent, contactEmail }: LegalPageProps) {
  return (
    <main className="page-content narrow-content legal-page">
      <span className="eyebrow">Informations neneen</span>
      {managedContent ? (
        <>
          <h1>{managedContent.title}</h1>
          <p>{managedContent.body}</p>
        </>
      ) : slug === 'faq' ? (
        <>
          <h1>
            Questions <em>pratiques.</em>
          </h1>
          <details open>
            <summary>Puis-je annuler une réservation ?</summary>
            <p>
              Une demande d’annulation peut être faite jusqu’à 7 jours avant l’activité. Les
              modalités de remboursement dépendent du moyen de paiement et des conditions
              communiquées pour chaque sortie.
            </p>
          </details>
          <details>
            <summary>Que se passe-t-il si une activité est annulée ?</summary>
            <p>
              neneen vous informe et propose un report ou le remboursement de votre réservation.
            </p>
          </details>
          <details>
            <summary>Quels moyens de paiement sont acceptés ?</summary>
            <p>
              Wave, Orange Money, carte bancaire ou espèces sur place. Le paiement en ligne sera
              activé après raccordement du fournisseur.
            </p>
          </details>
          <details>
            <summary>Faut-il un compte pour réserver ?</summary>
            <p>
              Oui. Votre espace membre regroupe les réservations et commandes associées à votre
              compte.
            </p>
          </details>
        </>
      ) : slug === 'cgv' ? (
        <>
          <h1>
            Conditions générales <em>de vente.</em>
          </h1>
          <p>
            Les prix sont indiqués en francs CFA. Une commande ou réservation est enregistrée en
            attente tant que le paiement n’a pas été confirmé. Les demandes d’annulation et de
            remboursement sont traitées selon les conditions communiquées pour l’activité ou la
            commande concernée.
          </p>
          <p>
            Les présentes conditions sont à compléter avec les informations légales et les
            coordonnées de l’entreprise avant toute mise en production.
          </p>
        </>
      ) : (
        <>
          <h1>
            Mentions <em>légales.</em>
          </h1>
          <p>neneen · Dakar, Sénégal {contactEmail && `· Contact : ${contactEmail}`}</p>
          <p>
            La raison sociale, le NINEA, le RCCM, le directeur de publication, l’hébergeur et les
            mentions relatives aux données personnelles doivent être ajoutés avant la mise en ligne
            publique.
          </p>
        </>
      )}
    </main>
  )
}
