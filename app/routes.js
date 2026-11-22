module.exports = function(app, passport, db, ObjectID) {
  app.get('/', function(req, res) { res.render('index.ejs'); });
  app.get('/profile', isLoggedIn, function(req, res) {
    db.collection('patients').find({ owner: String(req.user._id) }).toArray(function(err, patients) {
      if (err) return res.status(500).send('Database error');
      res.render('profile.ejs', { user: req.user, patients: patients });
    });
  });
  app.post('/patients', isLoggedIn, function(req, res) {
    if (!req.body.name || !req.body.email) return res.redirect('/profile');
    db.collection('patients').insertOne({ owner: String(req.user._id), name: req.body.name, email: req.body.email, language: req.body.language, diagnosis: req.body.diagnosis }, function(err) {
      if (err) return res.status(500).send('Could not save patient');
      res.redirect('/profile');
    });
  });
  app.get('/patients/:id', isLoggedIn, function(req, res) {
    if (!ObjectID.isValid(req.params.id)) return res.redirect('/profile');
    db.collection('patients').findOne({ _id: new ObjectID(req.params.id), owner: String(req.user._id) }, function(err, patient) {
      if (err || !patient) return res.redirect('/profile');
      let spanish = patient.language === 'Spanish';
      let info = {
        'Gingivitis': ['Gingivitis means your gums are irritated and inflamed, often because plaque has built up.', 'La gingivitis significa que las encías están inflamadas, a menudo por acumulación de placa.', 'A dental cleaning and better daily brushing and flossing may help.', 'Una limpieza dental y una mejor higiene diaria pueden ayudar.'],
        'Periodontal disease': ['Periodontal disease is an infection and inflammation that can damage the gums and bone supporting your teeth.', 'La enfermedad periodontal es una infección e inflamación que puede dañar las encías y el hueso que sostiene los dientes.', 'Your dental professional may recommend a deep cleaning called scaling and root planing.', 'Su profesional dental puede recomendar una limpieza profunda llamada raspado y alisado radicular.'],
        'Dental caries': ['Dental caries means tooth decay, also called a cavity.', 'La caries dental es el deterioro del diente, también llamado cavidad.', 'Your dentist may recommend a filling depending on the tooth.', 'Su dentista puede recomendar un empaste según el diente.']
      };
      let item = info[patient.diagnosis] || info['Gingivitis'];
      res.render('summary.ejs', { patient: patient, explanation: item[spanish ? 1 : 0], treatment: item[spanish ? 3 : 2] });
    });
  });
  app.post('/patients/:id/update', isLoggedIn, function(req, res) {
    if (!ObjectID.isValid(req.params.id)) return res.redirect('/profile');
    if (!['English','Spanish'].includes(req.body.language) || !['Gingivitis','Periodontal disease','Dental caries'].includes(req.body.diagnosis)) return res.redirect('/profile');
    db.collection('patients').updateOne({ _id: new ObjectID(req.params.id), owner: String(req.user._id) }, { $set: { language: req.body.language, diagnosis: req.body.diagnosis } }, function(err) {
      if (err) return res.status(500).send('Update failed');
      res.redirect('/patients/' + req.params.id);
    });
  });
  app.post('/patients/:id/delete', isLoggedIn, function(req, res) {
    if (!ObjectID.isValid(req.params.id)) return res.redirect('/profile');
    db.collection('patients').deleteOne({ _id: new ObjectID(req.params.id), owner: String(req.user._id) }, function(err) {
      if (err) return res.status(500).send('Delete failed');
      res.redirect('/profile');
    });
  });
  app.get('/logout', function(req, res) { req.logout(); res.redirect('/'); });
  app.get('/login', function(req, res) { res.render('login.ejs', { message: req.flash('loginMessage') }); });
  app.post('/login', passport.authenticate('local-login', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));
  app.get('/signup', function(req, res) { res.render('signup.ejs', { message: req.flash('signupMessage') }); });
  app.post('/signup', passport.authenticate('local-signup', { successRedirect: '/profile', failureRedirect: '/signup', failureFlash: true }));
};
function isLoggedIn(req, res, next) { if (req.isAuthenticated()) return next(); res.redirect('/'); }
