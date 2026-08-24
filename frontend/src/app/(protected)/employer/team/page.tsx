'use client';

import React, {
  FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  FiMail,
  FiPlus,
  FiSearch,
  FiUsers,
  FiBriefcase,
  FiUserCheck,
  FiX,
} from 'react-icons/fi';

import TeamService from '@/lib/api/services/team';

import {
  TeamMember,
  TeamMemberCreate,
  TeamMemberRole,
  TeamMemberStatus,
} from '@/types/team';

import styles from './page.module.css';


function getFullName(member: TeamMember) {
  return [member.first_name, member.last_name]
    .filter(Boolean)
    .join(' ');
}


function roleLabel(role: TeamMemberRole) {
  return role === TeamMemberRole.INTERVIEWER
    ? 'Interviewer'
    : 'Recruiter';
}


function statusLabel(status: TeamMemberStatus) {
  switch (status) {
    case TeamMemberStatus.ACTIVE:
      return 'Active';
    case TeamMemberStatus.REJECTED:
      return 'Rejected';
    case TeamMemberStatus.DISABLED:
      return 'Disabled';
    default:
      return 'Invited';
  }
}


export default function TeamPage() {

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] =
    useState<TeamMemberCreate>({
      first_name: '',
      last_name: '',
      email: '',
      role: TeamMemberRole.INTERVIEWER,
      job_title: '',
      experience_years: undefined,
      skills: [],
    });


  const fetchMembers = async () => {

    setLoading(true);

    try {

      const res =
        await TeamService.getTeamMembers();

      if (res.success && res.data) {
        setMembers(res.data.members ?? []);
      }

    } catch (error) {

      console.error(
        'Failed to load team members:',
        error
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    fetchMembers();
  }, []);


  const resetForm = () => {

    setForm({
      first_name: '',
      last_name: '',
      email: '',
      role: TeamMemberRole.INTERVIEWER,
      job_title: '',
      experience_years: undefined,
      skills: [],
    });

  };


  const handleSubmit = async (
    event: FormEvent
  ) => {

    event.preventDefault();

    if (
      !form.first_name.trim() ||
      !form.email.trim()
    ) {
      return;
    }

    setSubmitting(true);

    try {

      const res =
        await TeamService.addTeamMember({
          ...form,
          first_name: form.first_name.trim(),
          last_name:
            form.last_name?.trim() || undefined,
          email: form.email.trim().toLowerCase(),
          job_title:
            form.job_title?.trim() || undefined,
        });

      if (res.success && res.data) {

        setMembers(prev => [
          res.data!,
          ...prev,
        ]);

        setShowModal(false);
        resetForm();

      }

    } catch (error) {

      console.error(
        'Failed to add team member:',
        error
      );

    } finally {

      setSubmitting(false);

    }
  };


  const filteredMembers =
    members.filter(member => {

      const text = [
        getFullName(member),
        member.email,
        roleLabel(member.role),
        member.job_title ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    });


  return (
    <div className={styles.page}>

      <header className={styles.header}>

        <div className={styles.headerLeft}>

          <div className={styles.headerIcon}>
            <FiUsers size={20} />
          </div>

          <div>
            <h1>Team</h1>

            <p>
              Manage recruiters and interviewers
              in your organization.
            </p>
          </div>

        </div>


        <button
          className={styles.addButton}
          onClick={() => setShowModal(true)}
        >
          <FiPlus size={15} />
          Add team member
        </button>

      </header>


      <div className={styles.toolbar}>

        <div className={styles.searchBox}>

          <FiSearch size={15} />

          <input
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
            placeholder="Search by name, email or role..."
          />

        </div>


        <span className={styles.memberCount}>
          {members.length}{' '}
          {members.length === 1
            ? 'member'
            : 'members'}
        </span>

      </div>


      <main>

        {loading ? (

          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading team…</p>
          </div>

        ) : filteredMembers.length === 0 ? (

          <div className={styles.empty}>

            <div className={styles.emptyIcon}>
              <FiUsers size={24} />
            </div>

            <h3>
              {members.length === 0
                ? 'No team members yet'
                : 'No matching members'}
            </h3>

            <p>
              {members.length === 0
                ? 'Add recruiters and interviewers to your organization.'
                : 'Try a different search.'}
            </p>

          </div>

        ) : (

          <div className={styles.list}>

            {filteredMembers.map(member => (

              <article
                key={member.id}
                className={styles.memberCard}
              >

                <div className={styles.avatar}>
                  {member.first_name
                    .charAt(0)
                    .toUpperCase()}
                </div>


                <div className={styles.memberMain}>

                  <div className={styles.memberTop}>

                    <div>

                      <h3>
                        {getFullName(member)}
                      </h3>

                      <p>
                        <FiMail size={12} />
                        {member.email}
                      </p>

                    </div>


                    <span
                      className={`${styles.status} ${
                        member.status ===
                        TeamMemberStatus.ACTIVE
                          ? styles.statusActive
                          : styles.statusInvited
                      }`}
                    >
                      {statusLabel(member.status)}
                    </span>

                  </div>


                  <div className={styles.memberMeta}>

                    <span className={styles.role}>
                      {member.role ===
                      TeamMemberRole.INTERVIEWER
                        ? <FiUserCheck size={13} />
                        : <FiBriefcase size={13} />
                      }

                      {roleLabel(member.role)}
                    </span>


                    {member.job_title && (
                      <span>
                        {member.job_title}
                      </span>
                    )}

                    {member.experience_years != null && (
                      <span>
                        {member.experience_years}
                        {' '}
                        {member.experience_years === 1
                          ? 'year'
                          : 'years'} experience
                      </span>
                    )}

                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

      </main>


      {showModal && (

        <div
          className={styles.modalOverlay}
          onMouseDown={() =>
            !submitting &&
            setShowModal(false)
          }
        >

          <div
            className={styles.modal}
            onMouseDown={event =>
              event.stopPropagation()
            }
          >

            <div className={styles.modalHeader}>

              <div>

                <h2>
                  Add team member
                </h2>

                <p>
                  Invite a recruiter or interviewer.
                </p>

              </div>


              <button
                className={styles.closeButton}
                onClick={() =>
                  !submitting &&
                  setShowModal(false)
                }
              >
                <FiX size={17} />
              </button>

            </div>


            <form
              className={styles.form}
              onSubmit={handleSubmit}
            >

              <div className={styles.formGrid}>

                <label>
                  <span>First name *</span>

                  <input
                    value={form.first_name}
                    onChange={event =>
                      setForm(prev => ({
                        ...prev,
                        first_name:
                          event.target.value,
                      }))
                    }
                    required
                  />
                </label>


                <label>
                  <span>Last name</span>

                  <input
                    value={form.last_name ?? ''}
                    onChange={event =>
                      setForm(prev => ({
                        ...prev,
                        last_name:
                          event.target.value,
                      }))
                    }
                  />
                </label>

              </div>


              <label>
                <span>Email *</span>

                <input
                  type="email"
                  value={form.email}
                  onChange={event =>
                    setForm(prev => ({
                      ...prev,
                      email:
                        event.target.value,
                    }))
                  }
                  required
                />
              </label>


              <label>
                <span>Role *</span>

                <select
                  value={form.role}
                  onChange={event =>
                    setForm(prev => ({
                      ...prev,
                      role:
                        event.target.value as TeamMemberRole,
                    }))
                  }
                >

                  <option
                    value={TeamMemberRole.INTERVIEWER}
                  >
                    Interviewer
                  </option>

                  <option
                    value={TeamMemberRole.RECRUITER}
                  >
                    Recruiter
                  </option>

                </select>

              </label>


              {form.role ===
                TeamMemberRole.INTERVIEWER && (

                <>

                  <label>
                    <span>Job title</span>

                    <input
                      value={
                        form.job_title ?? ''
                      }
                      onChange={event =>
                        setForm(prev => ({
                          ...prev,
                          job_title:
                            event.target.value,
                        }))
                      }
                      placeholder="Senior Software Engineer"
                    />
                  </label>


                  <label>
                    <span>
                      Years of experience
                    </span>

                    <input
                      type="number"
                      min={0}
                      value={
                        form.experience_years ?? ''
                      }
                      onChange={event =>
                        setForm(prev => ({
                          ...prev,
                          experience_years:
                            event.target.value
                              ? Number(
                                  event.target.value
                                )
                              : undefined,
                        }))
                      }
                    />
                  </label>

                </>

              )}


              <div className={styles.modalFooter}>

                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() =>
                    !submitting &&
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={submitting}
                >
                  {submitting
                    ? 'Sending…'
                    : 'Send invitation'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}